-- RPC function to compute fair shares for all members of a group
-- Based on income/weight proportions with deterministic rounding

CREATE OR REPLACE FUNCTION public.compute_shares(p_group_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_weight NUMERIC(12,2);
  v_total_expenses NUMERIC(12,2);
  v_member_count INTEGER;
  v_shares JSON;
  v_share_sum NUMERIC(12,2);
  v_difference NUMERIC(12,2);
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Calculate total weight (sum of all active members' capacity/income/weight)
  -- Includes both real members (from profiles) and phantom members
  -- Priority: monthly_capacity > weight_override > income_or_weight
  SELECT
    COALESCE(SUM(
      CASE
        WHEN gm.is_phantom THEN gm.phantom_income
        ELSE COALESCE(p.weight_override, p.monthly_capacity, p.income_or_weight)
      END
    ), 0),
    COUNT(*)
  INTO v_total_weight, v_member_count
  FROM public.group_members gm
  LEFT JOIN public.profiles p ON gm.user_id = p.id
  WHERE gm.group_id = p_group_id
    AND (gm.is_phantom = true OR p.deleted_at IS NULL);

  -- Calculate total expenses for the group
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_expenses
  FROM public.expenses
  WHERE group_id = p_group_id;

  -- Edge case: if total weight is 0, distribute equally
  IF v_total_weight = 0 OR v_member_count = 0 THEN
    SELECT json_build_object(
      'total_expenses', v_total_expenses,
      'shares', json_agg(
        json_build_object(
          'member_id', gm.id,
          'user_id', gm.user_id,
          'pseudo', COALESCE(p.pseudo, gm.phantom_pseudo),
          'share_percentage', ROUND(100.0 / NULLIF(v_member_count, 0), 2),
          'share_amount', ROUND(v_total_expenses / NULLIF(v_member_count, 0), 2)
        )
      )
    )
    INTO v_shares
    FROM public.group_members gm
    LEFT JOIN public.profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
      AND (gm.is_phantom = true OR p.deleted_at IS NULL);

    RETURN v_shares;
  END IF;

  -- Calculate proportional shares with rounding
  WITH calculated_shares AS (
    SELECT
      gm.id AS member_id,
      gm.user_id,
      COALESCE(p.pseudo, gm.phantom_pseudo) AS pseudo,
      ROUND(
        (
          CASE
            WHEN gm.is_phantom THEN gm.phantom_income
            ELSE COALESCE(p.weight_override, p.monthly_capacity, p.income_or_weight)
          END / v_total_weight
        ) * 100,
        2
      ) AS share_percentage,
      ROUND(
        (
          CASE
            WHEN gm.is_phantom THEN gm.phantom_income
            ELSE COALESCE(p.weight_override, p.monthly_capacity, p.income_or_weight)
          END / v_total_weight
        ) * v_total_expenses,
        2
      ) AS share_amount
    FROM public.group_members gm
    LEFT JOIN public.profiles p ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
      AND (gm.is_phantom = true OR p.deleted_at IS NULL)
    ORDER BY
      CASE
        WHEN gm.is_phantom THEN gm.phantom_income
        ELSE COALESCE(p.weight_override, p.monthly_capacity, p.income_or_weight)
      END DESC
  )
  SELECT json_build_object(
    'total_expenses', v_total_expenses,
    'shares', json_agg(
      json_build_object(
        'member_id', member_id,
        'user_id', user_id,
        'pseudo', pseudo,
        'share_percentage', share_percentage,
        'share_amount', share_amount
      )
    )
  )
  INTO v_shares
  FROM calculated_shares;

  -- Compensate for rounding errors (add difference to largest share)
  SELECT SUM((v_shares->'shares'->i->>'share_amount')::NUMERIC)
  INTO v_share_sum
  FROM json_array_length((v_shares->'shares')::json) AS len,
       generate_series(0, len - 1) AS i;

  v_difference := v_total_expenses - COALESCE(v_share_sum, 0);

  -- If there's a difference, add it to the first (largest) share
  IF v_difference <> 0 AND json_array_length((v_shares->'shares')::json) > 0 THEN
    v_shares := jsonb_set(
      v_shares::jsonb,
      ARRAY['shares', '0', 'share_amount'],
      to_jsonb((v_shares->'shares'->0->>'share_amount')::NUMERIC + v_difference)
    )::json;
  END IF;

  RETURN v_shares;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.compute_shares(UUID) TO authenticated;
