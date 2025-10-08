-- RPC function to atomically leave a group
-- Removes user from group and deletes group if it's the last member

CREATE OR REPLACE FUNCTION public.leave_group(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining_members INTEGER;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Remove current user from group
  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();

  -- Check remaining members count
  SELECT COUNT(*) INTO v_remaining_members
  FROM public.group_members
  WHERE group_id = p_group_id;

  -- If no members left, delete the group (cascade will delete expenses)
  IF v_remaining_members = 0 THEN
    DELETE FROM public.groups WHERE id = p_group_id;

    RETURN json_build_object('group_deleted', true);
  END IF;

  -- Group still has members
  RETURN json_build_object('group_deleted', false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.leave_group(UUID) TO authenticated;
