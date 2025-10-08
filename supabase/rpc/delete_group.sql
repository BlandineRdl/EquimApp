-- RPC function to delete a group (creator only)
-- Removes all members and deletes the group

CREATE OR REPLACE FUNCTION public.delete_group(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Get group creator ID
  SELECT creator_id INTO v_creator_id
  FROM public.groups
  WHERE id = p_group_id;

  -- Check if group exists
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Groupe non trouvé';
  END IF;

  -- Check if current user is the creator
  IF v_creator_id != auth.uid() THEN
    RAISE EXCEPTION 'Seul le créateur peut supprimer le groupe';
  END IF;

  -- Delete all group members (will cascade from group deletion, but explicit for clarity)
  DELETE FROM public.group_members
  WHERE group_id = p_group_id;

  -- Delete the group (cascade will delete expenses and invitations)
  DELETE FROM public.groups WHERE id = p_group_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_group(UUID) TO authenticated;
