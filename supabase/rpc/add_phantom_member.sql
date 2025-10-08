-- RPC function to add a phantom member to a group
-- Phantom members don't have accounts but can be claimed later

CREATE OR REPLACE FUNCTION public.add_phantom_member(
  p_group_id UUID,
  p_pseudo TEXT,
  p_income NUMERIC(12,2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id UUID;
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
    RAISE EXCEPTION 'You must be a member of the group to add members';
  END IF;

  -- Validate input
  IF p_pseudo IS NULL OR LENGTH(TRIM(p_pseudo)) < 2 THEN
    RAISE EXCEPTION 'Pseudo must be at least 2 characters';
  END IF;

  IF p_income IS NULL OR p_income <= 0 THEN
    RAISE EXCEPTION 'Income must be positive';
  END IF;

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
    p_pseudo,
    p_income,
    true
  )
  RETURNING id INTO v_member_id;

  -- Recompute shares
  v_shares := public.compute_shares(p_group_id);

  -- Return member ID and new shares
  RETURN json_build_object(
    'member_id', v_member_id,
    'shares', v_shares
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_phantom_member(UUID, TEXT, NUMERIC) TO authenticated;
