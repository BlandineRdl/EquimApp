-- Test suite for compute_shares function using pg_tap
-- To run: supabase test db
-- Or: psql -h localhost -p 54322 -U postgres -d postgres -f supabase/tests/compute_shares.pgtap.sql

BEGIN;

-- Load pg_tap extension
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Plan: number of tests we'll run
SELECT plan(13);

-- Clean up any existing test data
DELETE FROM public.expenses WHERE group_id IN (
  SELECT id FROM public.groups WHERE name LIKE 'TEST_SHARE_CALC_%'
);
DELETE FROM public.group_members WHERE group_id IN (
  SELECT id FROM public.groups WHERE name LIKE 'TEST_SHARE_CALC_%'
);
DELETE FROM public.user_personal_expenses WHERE user_id IN (
  SELECT id FROM public.profiles WHERE pseudo LIKE 'TEST_PERSON_%'
);
DELETE FROM public.profiles WHERE pseudo LIKE 'TEST_PERSON_%';
DELETE FROM public.groups WHERE name LIKE 'TEST_SHARE_CALC_%';

-- Create test users
INSERT INTO public.profiles (id, pseudo, income_or_weight, monthly_capacity)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'TEST_PERSON_1', 3200.00, 3029.01),
  ('22222222-2222-2222-2222-222222222222', 'TEST_PERSON_2', 2800.00, 2660.00);

-- Create personal expenses for Person 1 (total: 170.99€)
INSERT INTO public.user_personal_expenses (user_id, label, amount)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Abonnement sport', 50.00),
  ('11111111-1111-1111-1111-111111111111', 'Cours de cuisine', 30.00),
  ('11111111-1111-1111-1111-111111111111', 'Traitement pour l''asthme', 20.00),
  ('11111111-1111-1111-1111-111111111111', 'Abonnement steam', 5.99),
  ('11111111-1111-1111-1111-111111111111', 'Abonnement Téléphone', 15.00),
  ('11111111-1111-1111-1111-111111111111', 'Navigo', 50.00);

-- Create personal expenses for Person 2 (total: 140€)
INSERT INTO public.user_personal_expenses (user_id, label, amount)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Abonnement sport', 25.00),
  ('22222222-2222-2222-2222-222222222222', 'Protection périodique', 20.00),
  ('22222222-2222-2222-2222-222222222222', 'Manucure', 30.00),
  ('22222222-2222-2222-2222-222222222222', 'Abonnement Téléphone', 15.00),
  ('22222222-2222-2222-2222-222222222222', 'Navigo', 50.00);

-- TEST 1: Verify Person 1 personal expenses total
SELECT is(
  (SELECT SUM(amount) FROM public.user_personal_expenses WHERE user_id = '11111111-1111-1111-1111-111111111111'),
  170.99::NUMERIC(12,2),
  'Person 1 personal expenses should total 170.99€'
);

-- TEST 2: Verify Person 2 personal expenses total
SELECT is(
  (SELECT SUM(amount) FROM public.user_personal_expenses WHERE user_id = '22222222-2222-2222-2222-222222222222'),
  140.00::NUMERIC(12,2),
  'Person 2 personal expenses should total 140€'
);

-- Recalculate capacities
SELECT public.calculate_user_capacity('11111111-1111-1111-1111-111111111111');
SELECT public.calculate_user_capacity('22222222-2222-2222-2222-222222222222');

-- TEST 3: Verify Person 1 capacity
SELECT is(
  (SELECT monthly_capacity FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111'),
  3029.01::NUMERIC(12,2),
  'Person 1 capacity should be 3029.01€ (3200 - 170.99)'
);

-- TEST 4: Verify Person 2 capacity
SELECT is(
  (SELECT monthly_capacity FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222'),
  2660.00::NUMERIC(12,2),
  'Person 2 capacity should be 2660€ (2800 - 140)'
);

-- Create test group
INSERT INTO public.groups (id, name, currency_code, creator_id)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'TEST_SHARE_CALC_GROUP',
  'EUR',
  '11111111-1111-1111-1111-111111111111'
);

-- Add members to group
INSERT INTO public.group_members (group_id, user_id)
VALUES
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222');

-- Create household expenses (total: 1640€)
INSERT INTO public.expenses (group_id, name, amount, currency_code, created_by)
VALUES
  ('99999999-9999-9999-9999-999999999999', 'Abo internet', 25, 'EUR', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999999', 'Assurance logement', 50, 'EUR', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999999', 'Loyer', 1000, 'EUR', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999999', 'Electricité', 50, 'EUR', '11111111-1111-1111-1111-111111111111'),
  ('99999999-9999-9999-9999-999999999999', 'Netflix', 15, 'EUR', '22222222-2222-2222-2222-222222222222'),
  ('99999999-9999-9999-9999-999999999999', 'Nourriture', 500, 'EUR', '22222222-2222-2222-2222-222222222222');

-- TEST 5: Verify total household expenses
SELECT is(
  (SELECT SUM(amount) FROM public.expenses WHERE group_id = '99999999-9999-9999-9999-999999999999'),
  1640.00::NUMERIC(12,2),
  'Total household expenses should be 1640€'
);

-- Call compute_shares
DO $$
DECLARE
  v_result JSON;
BEGIN
  SELECT public.compute_shares('99999999-9999-9999-9999-999999999999') INTO v_result;

  -- Store result in temporary table for testing
  CREATE TEMP TABLE IF NOT EXISTS test_compute_result (result JSON);
  DELETE FROM test_compute_result;
  INSERT INTO test_compute_result VALUES (v_result);
END;
$$;

-- TEST 6: Verify total expenses in result
SELECT is(
  (SELECT (result->>'total_expenses')::NUMERIC FROM test_compute_result),
  1640.00::NUMERIC,
  'compute_shares should return total_expenses = 1640€'
);

-- TEST 7: Verify Person 1 share percentage (53.24%)
SELECT is(
  (SELECT (result->'shares'->0->>'share_percentage')::NUMERIC FROM test_compute_result),
  53.24::NUMERIC,
  'Person 1 should have 53.24% share'
);

-- TEST 8: Verify Person 1 share amount (873.19€)
SELECT is(
  (SELECT (result->'shares'->0->>'share_amount')::NUMERIC FROM test_compute_result),
  873.19::NUMERIC,
  'Person 1 should pay 873.19€'
);

-- TEST 9: Verify Person 2 share percentage (46.76%)
SELECT is(
  (SELECT (result->'shares'->1->>'share_percentage')::NUMERIC FROM test_compute_result),
  46.76::NUMERIC,
  'Person 2 should have 46.76% share'
);

-- TEST 10: Verify Person 2 share amount (766.81€)
SELECT is(
  (SELECT (result->'shares'->1->>'share_amount')::NUMERIC FROM test_compute_result),
  766.81::NUMERIC,
  'Person 2 should pay 766.81€'
);

-- TEST 11: Verify no rounding errors (sum of shares = total expenses)
SELECT is(
  (SELECT
    (result->'shares'->0->>'share_amount')::NUMERIC +
    (result->'shares'->1->>'share_amount')::NUMERIC
   FROM test_compute_result),
  1640.00::NUMERIC,
  'Sum of shares should equal total expenses (no rounding error)'
);

-- TEST 12: Verify Person 1 rest à vivre (3029.01 - 873.19 = 2155.82€)
SELECT is(
  3029.01 - (SELECT (result->'shares'->0->>'share_amount')::NUMERIC FROM test_compute_result),
  2155.82::NUMERIC,
  'Person 1 should have 2155.82€ rest à vivre'
);

-- TEST 13: Verify Person 2 rest à vivre (2660.00 - 766.81 = 1893.19€)
SELECT is(
  2660.00 - (SELECT (result->'shares'->1->>'share_amount')::NUMERIC FROM test_compute_result),
  1893.19::NUMERIC,
  'Person 2 should have 1893.19€ rest à vivre'
);

-- Cleanup
DELETE FROM public.expenses WHERE group_id = '99999999-9999-9999-9999-999999999999';
DELETE FROM public.group_members WHERE group_id = '99999999-9999-9999-9999-999999999999';
DELETE FROM public.groups WHERE id = '99999999-9999-9999-9999-999999999999';
DELETE FROM public.user_personal_expenses WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);
DELETE FROM public.profiles WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- Finish tests
SELECT * FROM finish();

ROLLBACK;
