-- RPC function to atomically accept a group invitation
-- Validates token, adds user to group, marks invitation as consumed, calculates shares

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

  -- Lock and fetch invitation
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token
  FOR UPDATE;

  -- Validate: token exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = 'P0001', DETAIL = 'invalid_token';
  END IF;

  -- Validate: not expired
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
    RAISE EXCEPTION 'expired_token' USING ERRCODE = 'P0001', DETAIL = 'expired_token';
  END IF;

  -- Validate: not already consumed
  IF v_invitation.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_consumed' USING ERRCODE = 'P0001', DETAIL = 'already_consumed';
  END IF;

  -- Try to insert new member (ON CONFLICT handles already member case)
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_invitation.group_id, auth.uid())
  ON CONFLICT (group_id, user_id) DO NOTHING
  RETURNING * INTO v_new_member;

  -- Validate: not already a member
  IF v_new_member IS NULL THEN
    RAISE EXCEPTION 'already_member' USING ERRCODE = 'P0001', DETAIL = 'already_member';
  END IF;

  -- Mark invitation as consumed
  UPDATE public.invitations
  SET accepted_by = auth.uid(), consumed_at = NOW()
  WHERE token = p_token;

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
