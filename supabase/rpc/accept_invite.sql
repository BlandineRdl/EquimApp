-- RPC function to atomically accept a group invitation
-- Validates token, adds user to group, calculates shares
-- No longer marks as consumed (multiple usage allowed)

CREATE OR REPLACE FUNCTION public.accept_invite(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_new_member RECORD;
  v_shares JSON;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Fetch invitation
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token;

  -- Validate: token exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = 'P0001', DETAIL = 'invalid_token';
  END IF;

  -- Validate: not expired (if expires_at is set)
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
    RAISE EXCEPTION 'expired_token' USING ERRCODE = 'P0001', DETAIL = 'expired_token';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_invitation.group_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already_member' USING ERRCODE = 'P0001', DETAIL = 'already_member';
  END IF;

  -- Insert new member
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_invitation.group_id, auth.uid())
  RETURNING * INTO v_new_member;

  -- Note: Invitation is NOT marked as consumed - multiple users can use the same link

  -- Calculate updated shares with new member
  v_shares := public.compute_shares(v_invitation.group_id);

  -- Return success with group ID and shares
  RETURN json_build_object(
    'group_id', v_invitation.group_id,
    'shares', v_shares
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_invite(TEXT) TO authenticated;

COMMENT ON FUNCTION public.accept_invite IS
'Accepte une invitation de groupe. Usage multiple autorisé (pas de marquage consumed).';
