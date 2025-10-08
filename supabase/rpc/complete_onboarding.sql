-- RPC function to atomically complete user onboarding
-- Creates profile, group, expenses, and calculates initial shares

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_pseudo TEXT,
  p_income NUMERIC(12,2),
  p_group_name TEXT,
  p_expenses JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id UUID;
  v_expense JSONB;
  v_shares JSON;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Create profile
  INSERT INTO public.profiles (id, pseudo, income_or_weight, currency_code, share_revenue)
  VALUES (auth.uid(), p_pseudo, p_income, 'EUR', true);

  -- Create group and add user as creator/member (atomic via create_group RPC)
  v_group_id := public.create_group(p_group_name, 'EUR');

  -- Insert all expenses
  FOR v_expense IN SELECT * FROM jsonb_array_elements(p_expenses)
  LOOP
    INSERT INTO public.expenses (
      group_id,
      name,
      amount,
      currency_code,
      is_predefined,
      created_by
    )
    VALUES (
      v_group_id,
      v_expense->>'name',
      (v_expense->>'amount')::NUMERIC(12,2),
      'EUR',
      COALESCE((v_expense->>'is_predefined')::BOOLEAN, false),
      auth.uid()
    );
  END LOOP;

  -- Calculate initial shares
  v_shares := public.compute_shares(v_group_id);

  -- Return success with profile ID, group ID, and shares
  RETURN json_build_object(
    'profile_id', auth.uid(),
    'group_id', v_group_id,
    'shares', v_shares
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, NUMERIC, TEXT, JSONB) TO authenticated;
