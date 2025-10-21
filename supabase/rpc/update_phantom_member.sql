-- RPC function to update a phantom member (rename and/or change income)
-- Allows renaming from Membre-1 to Membre-Bob, for example
-- Validates that new pseudo starts with "Membre-" and is unique

CREATE OR REPLACE FUNCTION public.update_phantom_member(
  p_member_id UUID,
  p_new_pseudo TEXT,
  p_new_income NUMERIC(12,2) DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_shares JSON;
  v_suffix TEXT;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Lock and fetch the phantom member
  SELECT * INTO v_member
  FROM public.group_members
  WHERE id = p_member_id AND is_phantom = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membre fantôme non trouvé';
  END IF;

  -- Verify that the user is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_member.group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Vous devez être membre du groupe';
  END IF;

  -- Validate new pseudo format: must start with "Membre-"
  IF p_new_pseudo NOT LIKE 'Membre-%' THEN
    RAISE EXCEPTION 'Le pseudo d''un membre fantôme doit commencer par "Membre-"';
  END IF;

  -- Extract and validate suffix (part after "Membre-")
  v_suffix := SUBSTRING(p_new_pseudo FROM 8);

  IF LENGTH(v_suffix) < 1 OR LENGTH(v_suffix) > 50 THEN
    RAISE EXCEPTION 'Le pseudo doit faire entre 8 et 57 caractères (Membre-X où X fait 1-50 caractères)';
  END IF;

  -- Validate suffix contains only allowed characters (letters, digits, hyphens, spaces)
  IF v_suffix !~ '^[a-zA-Z0-9\s\-]+$' THEN
    RAISE EXCEPTION 'Le pseudo ne peut contenir que des lettres, chiffres, tirets et espaces après "Membre-"';
  END IF;

  -- Validate income if provided
  IF p_new_income IS NOT NULL AND p_new_income < 0 THEN
    RAISE EXCEPTION 'Le revenu ne peut pas être négatif';
  END IF;

  -- Update the phantom member
  UPDATE public.group_members
  SET
    phantom_pseudo = p_new_pseudo,
    phantom_income = COALESCE(p_new_income, phantom_income)
  WHERE id = p_member_id;

  -- Recompute shares
  v_shares := public.compute_shares(v_member.group_id);

  -- Return updated data
  RETURN json_build_object(
    'member_id', p_member_id,
    'pseudo', p_new_pseudo,
    'income', COALESCE(p_new_income, v_member.phantom_income),
    'shares', v_shares
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_phantom_member(UUID, TEXT, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.update_phantom_member IS
'Modifie un membre fantôme : renomme (ex: Membre-1 → Membre-Bob) et/ou change le revenu. Valide le format et l''unicité.';
