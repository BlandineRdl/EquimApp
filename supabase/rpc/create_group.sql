-- RPC function to atomically create a group and add creator as first member
-- Ensures transaction safety and prevents orphaned groups

CREATE OR REPLACE FUNCTION public.create_group(
  p_name TEXT,
  p_currency_code CHAR(3) DEFAULT 'EUR'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Insert the group
  INSERT INTO public.groups (name, creator_id, currency_code)
  VALUES (p_name, auth.uid(), p_currency_code)
  RETURNING id INTO v_group_id;

  -- Add creator as first member
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_group_id, auth.uid());

  -- Return the group ID
  RETURN v_group_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_group(TEXT, CHAR) TO authenticated;
