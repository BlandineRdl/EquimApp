-- Setup script for test database
-- Creates a separate schema for testing to avoid touching production data
--
-- Usage:
-- 1. Run this script once in your Supabase Dashboard
-- 2. Tests will run in the 'test' schema instead of 'public'
-- 3. No risk of affecting real data

-- Create test schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS test;

-- Grant permissions
GRANT USAGE ON SCHEMA test TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA test TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA test TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA test TO postgres, anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA test GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA test GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA test GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- Create test tables (mirror of public schema)
CREATE TABLE IF NOT EXISTS test.profiles (
  id UUID PRIMARY KEY,
  pseudo TEXT NOT NULL,
  income_or_weight NUMERIC(12,2),
  monthly_capacity NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test.user_personal_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES test.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test.groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  currency_code TEXT DEFAULT 'EUR',
  creator_id UUID NOT NULL REFERENCES test.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES test.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES test.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS test.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES test.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency_code TEXT DEFAULT 'EUR',
  created_by UUID NOT NULL REFERENCES test.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create test version of calculate_user_capacity function
CREATE OR REPLACE FUNCTION test.calculate_user_capacity(user_id UUID)
RETURNS NUMERIC(12,2) AS $$
DECLARE
  v_income NUMERIC(12,2);
  v_total_expenses NUMERIC(12,2);
  v_capacity NUMERIC(12,2);
BEGIN
  -- Get user's income
  SELECT income_or_weight INTO v_income
  FROM test.profiles
  WHERE id = user_id;

  -- Calculate total personal expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM test.user_personal_expenses
  WHERE user_personal_expenses.user_id = calculate_user_capacity.user_id;

  -- Calculate capacity
  v_capacity := v_income - v_total_expenses;

  -- Update profile
  UPDATE test.profiles
  SET monthly_capacity = v_capacity
  WHERE id = user_id;

  RETURN v_capacity;
END;
$$ LANGUAGE plpgsql;

-- Create test version of compute_shares function
CREATE OR REPLACE FUNCTION test.compute_shares(p_group_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_total_expenses NUMERIC(12,2);
  v_total_capacity NUMERIC(12,2);
  v_shares JSON[];
  v_member RECORD;
  v_share_percentage NUMERIC(12,2);
  v_share_amount NUMERIC(12,2);
  v_remaining NUMERIC(12,2);
  v_member_count INTEGER;
  v_current_index INTEGER := 0;
BEGIN
  -- Calculate total expenses for the group
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM test.expenses
  WHERE group_id = p_group_id;

  -- Calculate total capacity of all members
  SELECT COALESCE(SUM(COALESCE(monthly_capacity, income_or_weight, 0)), 0)
  INTO v_total_capacity
  FROM test.profiles
  WHERE id IN (
    SELECT user_id FROM test.group_members WHERE group_id = p_group_id
  );

  -- Count members
  SELECT COUNT(*) INTO v_member_count
  FROM test.group_members
  WHERE group_id = p_group_id;

  -- Prevent division by zero
  IF v_total_capacity = 0 THEN
    RETURN json_build_object(
      'total_expenses', v_total_expenses,
      'total_capacity', 0,
      'shares', '[]'::JSON
    );
  END IF;

  v_remaining := v_total_expenses;

  -- Calculate shares for each member
  FOR v_member IN
    SELECT
      p.id,
      p.pseudo,
      COALESCE(p.monthly_capacity, p.income_or_weight, 0) as capacity
    FROM test.profiles p
    JOIN test.group_members gm ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
    ORDER BY p.pseudo
  LOOP
    v_current_index := v_current_index + 1;

    -- Calculate percentage
    v_share_percentage := ROUND((v_member.capacity / v_total_capacity) * 100, 2);

    -- Calculate amount (last member gets the remaining to avoid rounding errors)
    IF v_current_index = v_member_count THEN
      v_share_amount := v_remaining;
    ELSE
      v_share_amount := ROUND((v_member.capacity / v_total_capacity) * v_total_expenses, 2);
      v_remaining := v_remaining - v_share_amount;
    END IF;

    -- Add to shares array
    v_shares := array_append(v_shares, json_build_object(
      'user_id', v_member.id,
      'pseudo', v_member.pseudo,
      'capacity', v_member.capacity,
      'share_percentage', v_share_percentage,
      'share_amount', v_share_amount,
      'rest_a_vivre', v_member.capacity - v_share_amount
    ));
  END LOOP;

  -- Build result
  v_result := json_build_object(
    'total_expenses', v_total_expenses,
    'total_capacity', v_total_capacity,
    'shares', array_to_json(v_shares)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ TEST DATABASE SCHEMA CREATED SUCCESSFULLY             ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Test schema "test" is ready to use.';
  RAISE NOTICE 'All tests will run in the "test" schema, isolated from "public".';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run compute_shares_test_schema.sql to execute tests';
  RAISE NOTICE '  2. Tests will not trigger destructive operation warnings';
  RAISE NOTICE '  3. Your production data in "public" schema is safe';
  RAISE NOTICE '';
END;
$$;
