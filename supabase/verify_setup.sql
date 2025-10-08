-- =============================================================================
-- Verification script for EquimApp Supabase setup
-- Run this after executing all schema, trigger, and RPC scripts
-- =============================================================================

-- Check all tables exist
DO $$
DECLARE
  missing_tables TEXT[];
  expected_tables TEXT[] := ARRAY['profiles', 'groups', 'group_members', 'expenses', 'invitations'];
  t TEXT;
BEGIN
  RAISE NOTICE '=== Checking Tables ===';

  FOREACH t IN ARRAY expected_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      missing_tables := array_append(missing_tables, t);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) IS NULL THEN
    RAISE NOTICE '✓ All tables exist';
  ELSE
    RAISE WARNING '✗ Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- Check RLS is enabled on all tables
DO $$
DECLARE
  tables_without_rls TEXT[];
  r RECORD;
BEGIN
  RAISE NOTICE '=== Checking RLS ===';

  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'groups', 'group_members', 'expenses', 'invitations')
      AND rowsecurity = false
  LOOP
    tables_without_rls := array_append(tables_without_rls, r.tablename);
  END LOOP;

  IF array_length(tables_without_rls, 1) IS NULL THEN
    RAISE NOTICE '✓ RLS enabled on all tables';
  ELSE
    RAISE WARNING '✗ RLS not enabled on: %', array_to_string(tables_without_rls, ', ');
  END IF;
END $$;

-- Check all RPC functions exist
DO $$
DECLARE
  missing_functions TEXT[];
  expected_functions TEXT[] := ARRAY[
    'compute_shares',
    'create_group',
    'complete_onboarding',
    'leave_group',
    'accept_invite',
    'get_invitation_details',
    'get_group_members'
  ];
  f TEXT;
BEGIN
  RAISE NOTICE '=== Checking RPC Functions ===';

  FOREACH f IN ARRAY expected_functions LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = f
        AND routine_type = 'FUNCTION'
    ) THEN
      missing_functions := array_append(missing_functions, f);
    END IF;
  END LOOP;

  IF array_length(missing_functions, 1) IS NULL THEN
    RAISE NOTICE '✓ All RPC functions exist';
  ELSE
    RAISE WARNING '✗ Missing functions: %', array_to_string(missing_functions, ', ');
  END IF;
END $$;

-- Check triggers exist
DO $$
DECLARE
  missing_triggers TEXT[];
  expected_triggers TEXT[] := ARRAY[
    'expenses_set_updated_at',
    'groups_set_updated_at',
    'expenses_currency_guard'
  ];
  t TEXT;
BEGIN
  RAISE NOTICE '=== Checking Triggers ===';

  FOREACH t IN ARRAY expected_triggers LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_schema = 'public' AND trigger_name = t
    ) THEN
      missing_triggers := array_append(missing_triggers, t);
    END IF;
  END LOOP;

  IF array_length(missing_triggers, 1) IS NULL THEN
    RAISE NOTICE '✓ All triggers exist';
  ELSE
    RAISE WARNING '✗ Missing triggers: %', array_to_string(missing_triggers, ', ');
  END IF;
END $$;

-- Check Realtime is enabled on expenses and group_members
DO $$
DECLARE
  realtime_tables TEXT[];
  missing_realtime TEXT[];
  expected_realtime TEXT[] := ARRAY['expenses', 'group_members'];
  t TEXT;
BEGIN
  RAISE NOTICE '=== Checking Realtime ===';

  SELECT array_agg(tablename)
  INTO realtime_tables
  FROM pg_publication_tables
  WHERE pubname = 'supabase_realtime';

  FOREACH t IN ARRAY expected_realtime LOOP
    IF NOT (t = ANY(realtime_tables)) THEN
      missing_realtime := array_append(missing_realtime, t);
    END IF;
  END LOOP;

  IF array_length(missing_realtime, 1) IS NULL THEN
    RAISE NOTICE '✓ Realtime enabled on expenses and group_members';
  ELSE
    RAISE WARNING '✗ Realtime not enabled on: %', array_to_string(missing_realtime, ', ');
  END IF;
END $$;

-- Check indexes exist
DO $$
DECLARE
  missing_indexes TEXT[];
  expected_indexes TEXT[] := ARRAY[
    'idx_group_members_user_id',
    'idx_expenses_group_id',
    'idx_expenses_created_by',
    'idx_invitations_token',
    'idx_profiles_deleted_at'
  ];
  i TEXT;
BEGIN
  RAISE NOTICE '=== Checking Indexes ===';

  FOREACH i IN ARRAY expected_indexes LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = i
    ) THEN
      missing_indexes := array_append(missing_indexes, i);
    END IF;
  END LOOP;

  IF array_length(missing_indexes, 1) IS NULL THEN
    RAISE NOTICE '✓ All indexes exist';
  ELSE
    RAISE WARNING '✗ Missing indexes: %', array_to_string(missing_indexes, ', ');
  END IF;
END $$;

-- Final summary
RAISE NOTICE '===========================================';
RAISE NOTICE 'Verification complete!';
RAISE NOTICE 'Check for any ✗ warnings above';
RAISE NOTICE '===========================================';
