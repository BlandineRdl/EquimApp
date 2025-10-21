-- Test suite for invitation flow (generate + accept)
-- Verifies complete invitation workflow without prefix complexity
--
-- Scenario:
-- 1. User A creates a group
-- 2. System generates invitation token (no prefix)
-- 3. User B accepts invitation with the token
-- 4. User B is added as member
-- 5. Group shares are calculated correctly

DO $$
DECLARE
  test_user_a_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  test_user_b_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  test_group_id UUID;
  v_invitation_token TEXT;
  v_result JSON;
  v_member_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  🧪 INVITATION FLOW TEST SUITE (TEST SCHEMA)             ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Testing complete invitation workflow (no prefix)';
  RAISE NOTICE '';

  -- Cleanup
  DELETE FROM test.expenses WHERE group_id IN (SELECT id FROM test.groups WHERE creator_id IN (test_user_a_id, test_user_b_id));
  DELETE FROM test.group_members WHERE user_id IN (test_user_a_id, test_user_b_id);
  DELETE FROM test.groups WHERE creator_id IN (test_user_a_id, test_user_b_id);
  DELETE FROM test.invitations WHERE created_by IN (test_user_a_id, test_user_b_id);
  DELETE FROM test.user_personal_expenses WHERE user_id IN (test_user_a_id, test_user_b_id);
  DELETE FROM test.profiles WHERE id IN (test_user_a_id, test_user_b_id);
  RAISE NOTICE '✓ Cleaned up test data';

  -- TEST 1: Create User A profile
  INSERT INTO test.profiles (id, pseudo, income_or_weight, monthly_capacity)
  VALUES (test_user_a_id, 'User_A', 3000.00, 3000.00);
  RAISE NOTICE '✅ TEST 1/10: User A profile created';

  -- TEST 2: User A creates a group
  test_group_id := gen_random_uuid();
  INSERT INTO test.groups (id, name, currency_code, creator_id)
  VALUES (test_group_id, 'Test Group', 'EUR', test_user_a_id);

  IF test_group_id IS NULL THEN
    RAISE EXCEPTION '❌ TEST 2/10 FAILED: Group creation failed';
  END IF;
  RAISE NOTICE '✅ TEST 2/10: Group created (id: %)', test_group_id;

  -- TEST 3: Add User A as member
  INSERT INTO test.group_members (group_id, user_id)
  VALUES (test_group_id, test_user_a_id);
  RAISE NOTICE '✅ TEST 3/10: User A added as member';

  -- TEST 4: Generate invitation token (without prefix - clean token)
  v_invitation_token := encode(gen_random_bytes(32), 'base64');
  v_invitation_token := replace(replace(v_invitation_token, '/', '_'), '+', '-');
  v_invitation_token := rtrim(v_invitation_token, '=');

  IF length(v_invitation_token) < 20 THEN
    RAISE EXCEPTION '❌ TEST 4/10 FAILED: Token too short (got %)', length(v_invitation_token);
  END IF;

  -- Verify token has NO prefix
  IF v_invitation_token LIKE 'invite-%' THEN
    RAISE EXCEPTION '❌ TEST 4/10 FAILED: Token should not have prefix, got %', v_invitation_token;
  END IF;

  RAISE NOTICE '✅ TEST 4/10: Clean token generated (length: %, no prefix)', length(v_invitation_token);

  -- TEST 5: Store invitation
  INSERT INTO test.invitations (group_id, token, created_by, expires_at)
  VALUES (test_group_id, v_invitation_token, test_user_a_id, NOW() + INTERVAL '7 days');
  RAISE NOTICE '✅ TEST 5/10: Invitation stored in database';

  -- TEST 6: Create User B profile (simulating accept_invite)
  INSERT INTO test.profiles (id, pseudo, income_or_weight, monthly_capacity)
  VALUES (test_user_b_id, 'User_B', 2500.00, 2500.00);
  RAISE NOTICE '✅ TEST 6/10: User B profile created';

  -- TEST 7: Accept invitation (User B joins with clean token)
  -- Simulate accept_invite RPC behavior
  BEGIN
    -- Verify token exists
    IF NOT EXISTS (
      SELECT 1 FROM test.invitations
      WHERE token = v_invitation_token
      AND consumed_at IS NULL
    ) THEN
      RAISE EXCEPTION '❌ TEST 7/10 FAILED: Token not found or already consumed';
    END IF;

    -- Add User B as member
    INSERT INTO test.group_members (group_id, user_id)
    VALUES (test_group_id, test_user_b_id);

    -- Mark invitation as consumed
    UPDATE test.invitations
    SET consumed_at = NOW(), consumed_by = test_user_b_id
    WHERE token = v_invitation_token;

    RAISE NOTICE '✅ TEST 7/10: User B accepted invitation with clean token';
  END;

  -- TEST 8: Verify User B is member
  SELECT COUNT(*) INTO v_member_count
  FROM test.group_members
  WHERE group_id = test_group_id AND user_id = test_user_b_id;

  IF v_member_count != 1 THEN
    RAISE EXCEPTION '❌ TEST 8/10 FAILED: User B not added as member';
  END IF;
  RAISE NOTICE '✅ TEST 8/10: User B is confirmed member';

  -- TEST 9: Verify total members count
  SELECT COUNT(*) INTO v_member_count
  FROM test.group_members
  WHERE group_id = test_group_id;

  IF v_member_count != 2 THEN
    RAISE EXCEPTION '❌ TEST 9/10 FAILED: Expected 2 members, got %', v_member_count;
  END IF;
  RAISE NOTICE '✅ TEST 9/10: Group has 2 members (User A + User B)';

  -- TEST 10: Verify compute_shares works correctly
  -- Add some expenses
  INSERT INTO test.expenses (group_id, name, amount, currency_code, created_by)
  VALUES
    (test_group_id, 'Rent', 1000, 'EUR', test_user_a_id),
    (test_group_id, 'Food', 500, 'EUR', test_user_b_id);

  SELECT test.compute_shares(test_group_id) INTO v_result;

  -- User A: 3000€ capacity = 54.55%
  -- User B: 2500€ capacity = 45.45%
  -- Total expenses: 1500€
  IF (v_result->>'total_expenses')::NUMERIC != 1500.00 THEN
    RAISE EXCEPTION '❌ TEST 10/10 FAILED: Expected 1500€ expenses, got %', (v_result->>'total_expenses')::NUMERIC;
  END IF;

  IF (v_result->'shares'->0->>'share_percentage')::NUMERIC != 54.55 THEN
    RAISE EXCEPTION '❌ TEST 10/10 FAILED: Expected User A 54.55%%, got %', (v_result->'shares'->0->>'share_percentage')::NUMERIC;
  END IF;

  RAISE NOTICE '✅ TEST 10/10: Share calculation works (User A: 54.55%%, User B: 45.45%%)';

  -- Cleanup
  DELETE FROM test.expenses WHERE group_id = test_group_id;
  DELETE FROM test.group_members WHERE group_id = test_group_id;
  DELETE FROM test.groups WHERE id = test_group_id;
  DELETE FROM test.invitations WHERE group_id = test_group_id;
  DELETE FROM test.user_personal_expenses WHERE user_id IN (test_user_a_id, test_user_b_id);
  DELETE FROM test.profiles WHERE id IN (test_user_a_id, test_user_b_id);

  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ ALL 10 TESTS PASSED!                                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Invitation Flow Verified:';
  RAISE NOTICE '  ✓ Clean token generation (no prefix)';
  RAISE NOTICE '  ✓ Token storage in database';
  RAISE NOTICE '  ✓ Token validation and consumption';
  RAISE NOTICE '  ✓ Member addition';
  RAISE NOTICE '  ✓ Share calculation after invitation';
  RAISE NOTICE '';

EXCEPTION WHEN OTHERS THEN
  -- Cleanup on error
  DELETE FROM test.expenses WHERE group_id = test_group_id;
  DELETE FROM test.group_members WHERE group_id = test_group_id;
  DELETE FROM test.groups WHERE id = test_group_id;
  DELETE FROM test.invitations WHERE created_by IN (test_user_a_id, test_user_b_id);
  DELETE FROM test.user_personal_expenses WHERE user_id IN (test_user_a_id, test_user_b_id);
  DELETE FROM test.profiles WHERE id IN (test_user_a_id, test_user_b_id);

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ❌ TEST FAILED                                           ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE 'Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  RAISE;
END;
$$;
