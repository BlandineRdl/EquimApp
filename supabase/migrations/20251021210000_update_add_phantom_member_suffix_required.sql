-- Migration: Make suffix required for add_phantom_member
-- Changes parameter name from p_pseudo to p_suffix (required)

-- Drop old function signature (UUID, TEXT, NUMERIC)
DROP FUNCTION IF EXISTS public.add_phantom_member(UUID, TEXT, NUMERIC);

-- Create new function with required suffix parameter
CREATE FUNCTION public.add_phantom_member(
  p_group_id UUID,
  p_suffix TEXT,
  p_income NUMERIC(12,2) DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
  v_pseudo TEXT;
  v_shares JSON;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Verify the user calling this function is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Vous devez être membre du groupe pour ajouter des membres';
  END IF;

  -- Validate income >= 0
  IF p_income < 0 THEN
    RAISE EXCEPTION 'Le revenu ne peut pas être négatif';
  END IF;

  -- Trim whitespace from suffix
  p_suffix := TRIM(p_suffix);

  -- Validate suffix length (1-50 characters)
  IF LENGTH(p_suffix) < 1 OR LENGTH(p_suffix) > 50 THEN
    RAISE EXCEPTION 'Le nom doit faire entre 1 et 50 caractères';
  END IF;

  -- Validate characters (letters, digits, hyphens, spaces)
  IF NOT p_suffix ~ '^[a-zA-Z0-9\s\-]+$' THEN
    RAISE EXCEPTION 'Le nom ne peut contenir que des lettres, chiffres, tirets et espaces';
  END IF;

  -- Generate pseudo with custom suffix
  v_pseudo := 'Membre-' || p_suffix;

  -- Insert phantom member
  INSERT INTO public.group_members (
    group_id,
    user_id,
    phantom_pseudo,
    phantom_income,
    is_phantom
  )
  VALUES (
    p_group_id,
    NULL, -- No user_id for phantoms
    v_pseudo,
    p_income,
    true
  )
  RETURNING id INTO v_member_id;

  -- Recompute shares
  v_shares := public.compute_shares(p_group_id);

  -- Return member ID, generated pseudo, and new shares
  RETURN json_build_object(
    'member_id', v_member_id,
    'pseudo', v_pseudo,
    'shares', v_shares
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_phantom_member(UUID, TEXT, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.add_phantom_member IS
'Ajoute un membre fantôme avec pseudo personnalisé (Membre-{suffix}) et revenu optionnel (défaut: 0). Le suffix est obligatoire.';
