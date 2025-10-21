-- RPC function to generate a secure invitation token
-- Generates cryptographically secure token server-side
-- Returns existing invitation if one already exists (one link per group, no expiration)
-- Only group creator can generate invitation

CREATE OR REPLACE FUNCTION public.generate_invitation(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_existing_invitation RECORD;
  v_group RECORD;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Get the group
  SELECT * INTO v_group FROM public.groups WHERE id = p_group_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Groupe non trouvé';
  END IF;

  -- Verify user is the creator of the group
  IF v_group.creator_id != auth.uid() THEN
    RAISE EXCEPTION 'Seul le créateur du groupe peut générer un lien d''invitation';
  END IF;

  -- Check if an active invitation already exists (without expiration)
  SELECT * INTO v_existing_invitation
  FROM public.invitations
  WHERE group_id = p_group_id
    AND expires_at IS NULL
  LIMIT 1;

  -- If an invitation exists, return it
  IF FOUND THEN
    RETURN json_build_object(
      'token', v_existing_invitation.token,
      'expires_at', NULL
    );
  END IF;

  -- Generate new cryptographically secure token
  v_token := replace(
    concat(
      replace(gen_random_uuid()::text, '-', ''),
      replace(gen_random_uuid()::text, '-', '')
    ),
    '-', ''
  );
  v_token := substring(v_token, 1, 32);

  -- Insert invitation without expiration
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
    NULL
  );

  -- Return token (no expiry)
  RETURN json_build_object(
    'token', v_token,
    'expires_at', NULL
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.generate_invitation(UUID) TO authenticated;

COMMENT ON FUNCTION public.generate_invitation IS
'Génère un lien d''invitation unique par groupe, sans expiration, usage multiple. Seul le créateur peut générer.';
