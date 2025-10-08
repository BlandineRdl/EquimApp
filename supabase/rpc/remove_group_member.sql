-- RPC function to remove a member from a group
-- Handles both real members and phantom members
-- Prevents removing the group creator

CREATE OR REPLACE FUNCTION public.remove_group_member(
  p_group_id UUID,
  p_member_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member RECORD;
  v_group RECORD;
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
    RAISE EXCEPTION 'You must be a member of the group to remove members';
  END IF;

  -- Get the member to remove
  SELECT * INTO v_member
  FROM public.group_members
  WHERE id = p_member_id
    AND group_id = p_group_id;

  -- Validate: member exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in this group';
  END IF;

  -- Get the group
  SELECT * INTO v_group
  FROM public.groups
  WHERE id = p_group_id;

  -- Validate: cannot remove the group creator
  IF v_member.user_id = v_group.creator_id THEN
    RAISE EXCEPTION 'Cannot remove the group creator';
  END IF;

  -- Delete the member
  DELETE FROM public.group_members
  WHERE id = p_member_id;

  -- Recompute shares
  v_shares := public.compute_shares(p_group_id);

  -- Return new shares
  RETURN json_build_object('shares', v_shares);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.remove_group_member(UUID, UUID) TO authenticated;
