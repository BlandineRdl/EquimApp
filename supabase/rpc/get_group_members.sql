-- RPC function to get all members of a group with their details
-- Bypasses RLS to allow reading pseudos of group members (authenticated only, validated membership)
-- Supports both real members (with profiles) and phantom members (without accounts)

CREATE OR REPLACE FUNCTION public.get_group_members(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Validate: current user must be a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_member' USING ERRCODE = 'P0001', DETAIL = 'not_member';
  END IF;

  -- Return member details (both real and phantom members)
  RETURN (
    SELECT json_agg(
      json_build_object(
        'member_id', gm.id,
        'user_id', gm.user_id,
        'pseudo', CASE
          WHEN gm.is_phantom THEN gm.phantom_pseudo
          ELSE p.pseudo
        END,
        'share_revenue', COALESCE(p.share_revenue, true), -- Phantom members always share by revenue
        'income_or_weight', CASE
          WHEN gm.is_phantom THEN gm.phantom_income
          WHEN p.share_revenue THEN COALESCE(p.weight_override, p.income_or_weight)
          ELSE NULL
        END,
        'joined_at', gm.joined_at,
        'is_phantom', gm.is_phantom
      )
      ORDER BY gm.joined_at ASC
    )
    FROM public.group_members gm
    LEFT JOIN public.profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
      AND (gm.is_phantom = true OR p.deleted_at IS NULL)
  );
END;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_group_members(UUID) TO authenticated;
