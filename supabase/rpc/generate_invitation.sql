-- RPC function to generate a secure invitation token
-- Generates cryptographically secure token server-side

CREATE OR REPLACE FUNCTION public.generate_invitation(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Verify user is member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Vous n''êtes pas membre de ce groupe';
  END IF;

  -- Generate cryptographically secure random token using gen_random_uuid()
  -- Combine multiple UUIDs for more entropy
  v_token := replace(
    concat(
      replace(gen_random_uuid()::text, '-', ''),
      replace(gen_random_uuid()::text, '-', '')
    ),
    '-', ''
  );
  -- Take first 32 characters for a clean token
  v_token := substring(v_token, 1, 32);

  -- Set expiration to 7 days from now
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Insert invitation
  INSERT INTO public.invitations (
    group_id,
    token,
    created_by,
    expires_at
  )
  VALUES (
    p_group_id,
    v_token,
    auth.uid(),
    v_expires_at
  );

  -- Return token and expiry
  RETURN json_build_object(
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_invitation(UUID) TO authenticated;
