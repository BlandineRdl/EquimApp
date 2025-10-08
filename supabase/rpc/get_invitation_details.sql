-- RPC function to get invitation preview details
-- Accessible to anon users (before login) - returns minimal non-sensitive data only

CREATE OR REPLACE FUNCTION public.get_invitation_details(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_details RECORD;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Fetch invitation details with group and creator info
  SELECT
    g.name AS group_name,
    p.pseudo AS creator_pseudo,
    i.expires_at,
    (i.consumed_at IS NOT NULL) AS is_consumed
  INTO v_details
  FROM public.invitations i
  JOIN public.groups g ON i.group_id = g.id
  JOIN public.profiles p ON i.created_by = p.id
  WHERE i.token = p_token
    AND p.deleted_at IS NULL;

  -- Return NULL if token doesn't exist
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Return minimal safe data (NO group_id, NO user IDs)
  RETURN json_build_object(
    'group_name', v_details.group_name,
    'creator_pseudo', v_details.creator_pseudo,
    'expires_at', v_details.expires_at,
    'is_consumed', v_details.is_consumed
  );
END;
$$;

-- Grant execute permission to both authenticated and anon users (for preview before login)
GRANT EXECUTE ON FUNCTION public.get_invitation_details(TEXT) TO authenticated, anon;
