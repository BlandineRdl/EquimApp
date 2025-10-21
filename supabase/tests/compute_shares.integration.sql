-- Test suite for compute_shares function using dedicated TEST schema
-- No destructive operations on production data!
--
-- Prerequisites: Run setup_test_database.sql first
--
-- Scenario:
-- Person 1: 3200€ income, 170.99€ personal expenses = 3029.01€ capacity
-- Person 2: 2800€ income, 140€ personal expenses = 2660€ capacity
-- Total capacity: 5689.01€
-- Household expenses: 1640€
--
-- Expected results:
-- Person 1: 53.24% = 873.19€ → Rest à vivre: 2155.82€
-- Person 2: 46.76% = 766.81€ → Rest à vivre: 1893.19€

DO $$
DECLARE
  test_person_1_id UUID := '11111111-1111-1111-1111-111111111111';
  test_person_2_id UUID := '22222222-2222-2222-2222-222222222222';
  test_group_id UUID := '99999999-9999-9999-9999-999999999999';
  v_result JSON;
  v_person1_expenses NUMERIC(12,2);
  v_person2_expenses NUMERIC(12,2);
  v_person1_capacity NUMERIC(12,2);
  v_person2_capacity NUMERIC(12,2);
  v_total_expenses NUMERIC(12,2);
  v_person1_share NUMERIC(12,2);
  v_person1_percentage NUMERIC(12,2);
  v_person2_share NUMERIC(12,2);
  v_person2_percentage NUMERIC(12,2);
  v_total_shares NUMERIC(12,2);
  v_person1_rest NUMERIC(12,2);
  v_person2_rest NUMERIC(12,2);
  v_test_count INTEGER := 0;
  v_passed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  🧪 COMPUTE_SHARES TEST SUITE (TEST SCHEMA)              ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Using TEST schema - production data is safe';
  RAISE NOTICE '';

  -- Clean up any existing test data
  DELETE FROM test.expenses WHERE group_id = test_group_id;
  DELETE FROM test.group_members WHERE group_id = test_group_id;
  DELETE FROM test.groups WHERE id = test_group_id;
  DELETE FROM test.user_personal_expenses WHERE user_id IN (test_person_1_id, test_person_2_id);
  DELETE FROM test.profiles WHERE id IN (test_person_1_id, test_person_2_id);
  RAISE NOTICE '✓ Cleaned up test schema';

  -- Create test users
  INSERT INTO test.profiles (id, pseudo, income_or_weight, monthly_capacity)
  VALUES
    (test_person_1_id, 'TEST_PERSON_1', 3200.00, 3029.01),
    (test_person_2_id, 'TEST_PERSON_2', 2800.00, 2660.00);
  RAISE NOTICE '✓ Created test users';

  -- Create personal expenses for Person 1 (total: 170.99€)
  INSERT INTO test.user_personal_expenses (user_id, label, amount)
  VALUES
    (test_person_1_id, 'Abonnement sport', 50.00),
    (test_person_1_id, 'Cours de cuisine', 30.00),
    (test_person_1_id, 'Traitement pour l''asthme', 20.00),
    (test_person_1_id, 'Abonnement steam', 5.99),
    (test_person_1_id, 'Abonnement Téléphone', 15.00),
    (test_person_1_id, 'Navigo', 50.00);

  -- Create personal expenses for Person 2 (total: 140€)
  INSERT INTO test.user_personal_expenses (user_id, label, amount)
  VALUES
    (test_person_2_id, 'Abonnement sport', 25.00),
    (test_person_2_id, 'Protection périodique', 20.00),
    (test_person_2_id, 'Manucure', 30.00),
    (test_person_2_id, 'Abonnement Téléphone', 15.00),
    (test_person_2_id, 'Navigo', 50.00);
  RAISE NOTICE '✓ Created personal expenses';
  RAISE NOTICE '';

  -- TEST 1: Verify Person 1 personal expenses total
  v_test_count := v_test_count + 1;
  SELECT SUM(amount) INTO v_person1_expenses
  FROM test.user_personal_expenses
  WHERE user_id = test_person_1_id;

  IF v_person1_expenses = 170.99 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 1/13: Person 1 expenses = 170.99€';
  ELSE
    RAISE EXCEPTION '❌ TEST 1/13 FAILED: Expected 170.99€, got %.2f€', v_person1_expenses;
  END IF;

  -- TEST 2: Verify Person 2 personal expenses total
  v_test_count := v_test_count + 1;
  SELECT SUM(amount) INTO v_person2_expenses
  FROM test.user_personal_expenses
  WHERE user_id = test_person_2_id;

  IF v_person2_expenses = 140.00 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 2/13: Person 2 expenses = 140.00€';
  ELSE
    RAISE EXCEPTION '❌ TEST 2/13 FAILED: Expected 140€, got %.2f€', v_person2_expenses;
  END IF;

  -- Recalculate capacities
  PERFORM test.calculate_user_capacity(test_person_1_id);
  PERFORM test.calculate_user_capacity(test_person_2_id);

  -- TEST 3: Verify Person 1 capacity
  v_test_count := v_test_count + 1;
  SELECT monthly_capacity INTO v_person1_capacity
  FROM test.profiles
  WHERE id = test_person_1_id;

  IF v_person1_capacity = 3029.01 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 3/13: Person 1 capacity = 3029.01€';
  ELSE
    RAISE EXCEPTION '❌ TEST 3/13 FAILED: Expected 3029.01€, got %.2f€', v_person1_capacity;
  END IF;

  -- TEST 4: Verify Person 2 capacity
  v_test_count := v_test_count + 1;
  SELECT monthly_capacity INTO v_person2_capacity
  FROM test.profiles
  WHERE id = test_person_2_id;

  IF v_person2_capacity = 2660.00 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 4/13: Person 2 capacity = 2660.00€';
  ELSE
    RAISE EXCEPTION '❌ TEST 4/13 FAILED: Expected 2660€, got %.2f€', v_person2_capacity;
  END IF;

  -- Create test group
  INSERT INTO test.groups (id, name, currency_code, creator_id)
  VALUES (test_group_id, 'TEST_GROUP', 'EUR', test_person_1_id);

  -- Add members
  INSERT INTO test.group_members (group_id, user_id)
  VALUES
    (test_group_id, test_person_1_id),
    (test_group_id, test_person_2_id);

  -- Create household expenses (total: 1640€)
  INSERT INTO test.expenses (group_id, name, amount, currency_code, created_by)
  VALUES
    (test_group_id, 'Abo internet', 25, 'EUR', test_person_1_id),
    (test_group_id, 'Assurance logement', 50, 'EUR', test_person_1_id),
    (test_group_id, 'Loyer', 1000, 'EUR', test_person_1_id),
    (test_group_id, 'Electricité', 50, 'EUR', test_person_1_id),
    (test_group_id, 'Netflix', 15, 'EUR', test_person_2_id),
    (test_group_id, 'Nourriture', 500, 'EUR', test_person_2_id);

  -- TEST 5: Verify total household expenses
  v_test_count := v_test_count + 1;
  SELECT SUM(amount) INTO v_total_expenses
  FROM test.expenses
  WHERE group_id = test_group_id;

  IF v_total_expenses = 1640.00 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 5/13: Total expenses = 1640.00€';
  ELSE
    RAISE EXCEPTION '❌ TEST 5/13 FAILED: Expected 1640€, got %.2f€', v_total_expenses;
  END IF;

  -- Call compute_shares
  SELECT test.compute_shares(test_group_id) INTO v_result;

  -- Extract results
  v_person1_percentage := (v_result->'shares'->0->>'share_percentage')::NUMERIC;
  v_person1_share := (v_result->'shares'->0->>'share_amount')::NUMERIC;
  v_person2_percentage := (v_result->'shares'->1->>'share_percentage')::NUMERIC;
  v_person2_share := (v_result->'shares'->1->>'share_amount')::NUMERIC;
  v_person1_rest := v_person1_capacity - v_person1_share;
  v_person2_rest := v_person2_capacity - v_person2_share;

  -- TEST 6: Total expenses in result
  v_test_count := v_test_count + 1;
  IF (v_result->>'total_expenses')::NUMERIC = 1640.00 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 6/13: Result total_expenses = 1640.00€';
  ELSE
    RAISE EXCEPTION '❌ TEST 6/13 FAILED: Expected 1640€, got %.2f€', (v_result->>'total_expenses')::NUMERIC;
  END IF;

  -- TEST 7: Person 1 percentage
  v_test_count := v_test_count + 1;
  IF v_person1_percentage = 53.24 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 7/13: Person 1 percentage = 53.24%%';
  ELSE
    RAISE EXCEPTION '❌ TEST 7/13 FAILED: Expected 53.24%%, got %.2f%%', v_person1_percentage;
  END IF;

  -- TEST 8: Person 1 share amount
  v_test_count := v_test_count + 1;
  IF v_person1_share = 873.19 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 8/13: Person 1 share = 873.19€';
  ELSE
    RAISE EXCEPTION '❌ TEST 8/13 FAILED: Expected 873.19€, got %.2f€', v_person1_share;
  END IF;

  -- TEST 9: Person 2 percentage
  v_test_count := v_test_count + 1;
  IF v_person2_percentage = 46.76 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 9/13: Person 2 percentage = 46.76%%';
  ELSE
    RAISE EXCEPTION '❌ TEST 9/13 FAILED: Expected 46.76%%, got %.2f%%', v_person2_percentage;
  END IF;

  -- TEST 10: Person 2 share amount
  v_test_count := v_test_count + 1;
  IF v_person2_share = 766.81 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 10/13: Person 2 share = 766.81€';
  ELSE
    RAISE EXCEPTION '❌ TEST 10/13 FAILED: Expected 766.81€, got %.2f€', v_person2_share;
  END IF;

  -- TEST 11: No rounding errors
  v_test_count := v_test_count + 1;
  v_total_shares := v_person1_share + v_person2_share;
  IF v_total_shares = 1640.00 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 11/13: Sum of shares = 1640.00€ (no rounding error)';
  ELSE
    RAISE EXCEPTION '❌ TEST 11/13 FAILED: Expected 1640€, got %.2f€', v_total_shares;
  END IF;

  -- TEST 12: Person 1 rest à vivre
  v_test_count := v_test_count + 1;
  IF v_person1_rest = 2155.82 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 12/13: Person 1 rest à vivre = 2155.82€';
  ELSE
    RAISE EXCEPTION '❌ TEST 12/13 FAILED: Expected 2155.82€, got %.2f€', v_person1_rest;
  END IF;

  -- TEST 13: Person 2 rest à vivre
  v_test_count := v_test_count + 1;
  IF v_person2_rest = 1893.19 THEN
    v_passed_count := v_passed_count + 1;
    RAISE NOTICE '✅ TEST 13/13: Person 2 rest à vivre = 1893.19€';
  ELSE
    RAISE EXCEPTION '❌ TEST 13/13 FAILED: Expected 1893.19€, got %.2f€', v_person2_rest;
  END IF;

  -- Cleanup
  DELETE FROM test.expenses WHERE group_id = test_group_id;
  DELETE FROM test.group_members WHERE group_id = test_group_id;
  DELETE FROM test.groups WHERE id = test_group_id;
  DELETE FROM test.user_personal_expenses WHERE user_id IN (test_person_1_id, test_person_2_id);
  DELETE FROM test.profiles WHERE id IN (test_person_1_id, test_person_2_id);

  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ ALL % TESTS PASSED!                                   ║', v_passed_count;
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Results Summary:';
  RAISE NOTICE '  Person 1: %.2f%% = %.2f€ (rest: %.2f€)', v_person1_percentage, v_person1_share, v_person1_rest;
  RAISE NOTICE '  Person 2: %.2f%% = %.2f€ (rest: %.2f€)', v_person2_percentage, v_person2_share, v_person2_rest;
  RAISE NOTICE '  Total: %.2f€ ✓', v_total_shares;
  RAISE NOTICE '';

EXCEPTION WHEN OTHERS THEN
  -- Cleanup on error
  DELETE FROM test.expenses WHERE group_id = test_group_id;
  DELETE FROM test.group_members WHERE group_id = test_group_id;
  DELETE FROM test.groups WHERE id = test_group_id;
  DELETE FROM test.user_personal_expenses WHERE user_id IN (test_person_1_id, test_person_2_id);
  DELETE FROM test.profiles WHERE id IN (test_person_1_id, test_person_2_id);

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ❌ TEST FAILED                                           ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE 'Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RAISE;
END;
$$;
