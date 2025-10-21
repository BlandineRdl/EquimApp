


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "test";


ALTER SCHEMA "test" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_invite"("p_token" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invitation RECORD;
  v_new_member RECORD;
  v_shares JSON;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Lock and fetch invitation
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token
  FOR UPDATE;

  -- Validate: token exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_token' USING ERRCODE = 'P0001', DETAIL = 'invalid_token';
  END IF;

  -- Validate: not expired
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
    RAISE EXCEPTION 'expired_token' USING ERRCODE = 'P0001', DETAIL = 'expired_token';
  END IF;

  -- Validate: not already consumed
  IF v_invitation.consumed_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_consumed' USING ERRCODE = 'P0001', DETAIL = 'already_consumed';
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_invitation.group_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'already_member' USING ERRCODE = 'P0001', DETAIL = 'already_member';
  END IF;

  -- Insert new member
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (v_invitation.group_id, auth.uid())
  RETURNING * INTO v_new_member;

  -- Mark invitation as consumed
  UPDATE public.invitations
  SET accepted_by = auth.uid(), consumed_at = NOW()
  WHERE token = p_token;

  -- Calculate updated shares with new member
  v_shares := public.compute_shares(v_invitation.group_id);

  -- Return success with group ID and shares
  RETURN json_build_object(
    'group_id', v_invitation.group_id,
    'shares', v_shares
  );
END;
$$;


ALTER FUNCTION "public"."accept_invite"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_phantom_member"("p_group_id" "uuid", "p_pseudo" "text", "p_income" numeric) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_member_id UUID;
  v_shares JSON;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Verify the user calling this function is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You must be a member of the group to add members';
  END IF;

  -- Validate input
  IF p_pseudo IS NULL OR LENGTH(TRIM(p_pseudo)) < 2 THEN
    RAISE EXCEPTION 'Pseudo must be at least 2 characters';
  END IF;

  IF p_income IS NULL OR p_income <= 0 THEN
    RAISE EXCEPTION 'Income must be positive';
  END IF;

  -- Insert phantom member
  INSERT INTO public.group_members (
    group_id,
    user_id,
    phantom_pseudo,
    phantom_income,
    is_phantom
  )
  VALUES (
    p_group_id,
    NULL, -- No user_id for phantoms
    p_pseudo,
    p_income,
    true
  )
  RETURNING id INTO v_member_id;

  -- Recompute shares
  v_shares := public.compute_shares(p_group_id);

  -- Return member ID and new shares
  RETURN json_build_object(
    'member_id', v_member_id,
    'shares', v_shares
  );
END;
$$;


ALTER FUNCTION "public"."add_phantom_member"("p_group_id" "uuid", "p_pseudo" "text", "p_income" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_user_capacity"("p_user_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_income NUMERIC(12,2);
  v_expenses_total NUMERIC(12,2);
  v_capacity NUMERIC(12,2);
BEGIN
  -- Get user income from profiles
  SELECT income_or_weight INTO v_income
  FROM public.profiles
  WHERE id = p_user_id;

  -- If no income, return NULL
  IF v_income IS NULL THEN
    RETURN NULL;
  END IF;

  -- Sum all personal expenses for user
  SELECT COALESCE(SUM(amount), 0) INTO v_expenses_total
  FROM public.user_personal_expenses
  WHERE user_id = p_user_id;

  -- Calculate capacity (income - expenses, can be negative)
  v_capacity := v_income - v_expenses_total;

  -- Update profiles table with new capacity
  UPDATE public.profiles
  SET monthly_capacity = v_capacity
  WHERE id = p_user_id;

  RETURN v_capacity;
END;
$$;


ALTER FUNCTION "public"."calculate_user_capacity"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_onboarding"("p_pseudo" "text", "p_income" numeric, "p_group_name" "text", "p_expenses" "jsonb") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."complete_onboarding"("p_pseudo" "text", "p_income" numeric, "p_group_name" "text", "p_expenses" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_shares"("p_group_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."compute_shares"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_group"("p_name" "text", "p_currency_code" character DEFAULT 'EUR'::"bpchar") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."create_group"("p_name" "text", "p_currency_code" character) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_expense"("p_expense_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_group_id UUID;
  v_is_member BOOLEAN;
BEGIN
  SET search_path = public;

  -- Get group_id from expense
  SELECT group_id INTO v_group_id
  FROM public.expenses
  WHERE id = p_expense_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Dépense non trouvée';
  END IF;

  -- Check if user is member of the group
  SELECT EXISTS(
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id AND user_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Vous devez être membre du groupe pour supprimer cette dépense';
  END IF;

  -- Delete the expense
  DELETE FROM public.expenses WHERE id = p_expense_id;

  RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."delete_expense"("p_expense_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_group"("p_group_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Get group creator ID
  SELECT creator_id INTO v_creator_id
  FROM public.groups
  WHERE id = p_group_id;

  -- Check if group exists
  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Groupe non trouvé';
  END IF;

  -- Check if current user is the creator
  IF v_creator_id != auth.uid() THEN
    RAISE EXCEPTION 'Seul le créateur peut supprimer le groupe';
  END IF;

  -- Delete all group members (will cascade from group deletion, but explicit for clarity)
  DELETE FROM public.group_members
  WHERE group_id = p_group_id;

  -- Delete the group (cascade will delete expenses and invitations)
  DELETE FROM public.groups WHERE id = p_group_id;

  RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."delete_group"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_group_currency"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_currency CHAR(3);
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Get the currency code of the group
  SELECT currency_code INTO v_currency
  FROM public.groups
  WHERE id = NEW.group_id;

  -- Raise exception if currencies don't match
  IF NEW.currency_code <> v_currency THEN
    RAISE EXCEPTION 'expense_currency_mismatch'
      USING ERRCODE = '22000',
            DETAIL = 'Expense currency must match group currency';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_group_currency"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invitation"("p_group_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Verify user is member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Vous n''êtes pas membre de ce groupe';
  END IF;

  -- Generate cryptographically secure random token using gen_random_uuid()
  -- Combine multiple UUIDs for more entropy
  v_token := replace(
    concat(
      replace(gen_random_uuid()::text, '-', ''),
      replace(gen_random_uuid()::text, '-', '')
    ),
    '-', ''
  );
  -- Take first 32 characters for a clean token
  v_token := substring(v_token, 1, 32);

  -- Set expiration to 7 days from now
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Insert invitation
  INSERT INTO public.invitations (
    group_id,
    token,
    created_by,
    expires_at
  )
  VALUES (
    p_group_id,
    v_token,
    auth.uid(),
    v_expires_at
  );

  -- Return token and expiry
  RETURN json_build_object(
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$$;


ALTER FUNCTION "public"."generate_invitation"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_group_members"("p_group_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
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
        'monthly_capacity', CASE
          WHEN gm.is_phantom THEN gm.phantom_income
          ELSE p.monthly_capacity
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


ALTER FUNCTION "public"."get_group_members"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invitation_details"("p_token" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_invitation_details"("p_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_group"("p_group_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_remaining_members INTEGER;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Remove current user from group
  DELETE FROM public.group_members
  WHERE group_id = p_group_id AND user_id = auth.uid();

  -- Check remaining members count
  SELECT COUNT(*) INTO v_remaining_members
  FROM public.group_members
  WHERE group_id = p_group_id;

  -- If no members left, delete the group (cascade will delete expenses)
  IF v_remaining_members = 0 THEN
    DELETE FROM public.groups WHERE id = p_group_id;

    RETURN json_build_object('group_deleted', true);
  END IF;

  -- Group still has members
  RETURN json_build_object('group_deleted', false);
END;
$$;


ALTER FUNCTION "public"."leave_group"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_group_member"("p_group_id" "uuid", "p_member_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_member RECORD;
  v_group RECORD;
  v_shares JSON;
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Verify the user calling this function is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You must be a member of the group to remove members';
  END IF;

  -- Get the member to remove
  SELECT * INTO v_member
  FROM public.group_members
  WHERE id = p_member_id
    AND group_id = p_group_id;

  -- Validate: member exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in this group';
  END IF;

  -- Get the group
  SELECT * INTO v_group
  FROM public.groups
  WHERE id = p_group_id;

  -- Validate: cannot remove the group creator
  IF v_member.user_id = v_group.creator_id THEN
    RAISE EXCEPTION 'Cannot remove the group creator';
  END IF;

  -- Delete the member
  DELETE FROM public.group_members
  WHERE id = p_member_id;

  -- Recompute shares
  v_shares := public.compute_shares(p_group_id);

  -- Return new shares
  RETURN json_build_object('shares', v_shares);
END;
$$;


ALTER FUNCTION "public"."remove_group_member"("p_group_id" "uuid", "p_member_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Update the updated_at column to current timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_capacity_on_expense_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Recalculate capacity for the affected user
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_user_capacity(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_user_capacity(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_capacity_on_expense_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_capacity_on_income_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only recalculate if income_or_weight has changed
  IF NEW.income_or_weight IS DISTINCT FROM OLD.income_or_weight THEN
    PERFORM public.calculate_user_capacity(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_capacity_on_income_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "test"."calculate_user_capacity"("user_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "test"."calculate_user_capacity"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "test"."compute_shares"("p_group_id" "uuid") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "test"."compute_shares"("p_group_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency_code" character(3) NOT NULL,
    "is_predefined" boolean DEFAULT false NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "expenses_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "expenses_creator_must_be_real_member" CHECK (("created_by" IS NOT NULL))
);

ALTER TABLE ONLY "public"."expenses" REPLICA IDENTITY FULL;


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phantom_pseudo" "text",
    "phantom_income" numeric(12,2),
    "is_phantom" boolean DEFAULT false NOT NULL,
    "claimed_at" timestamp with time zone,
    CONSTRAINT "phantom_has_data" CHECK (((("is_phantom" = false) AND ("user_id" IS NOT NULL) AND ("phantom_pseudo" IS NULL) AND ("phantom_income" IS NULL)) OR (("is_phantom" = true) AND ("user_id" IS NULL) AND ("phantom_pseudo" IS NOT NULL) AND ("phantom_income" IS NOT NULL))))
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "currency_code" character(3) DEFAULT 'EUR'::"bpchar" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "accepted_by" "uuid",
    "consumed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "pseudo" "text",
    "income_or_weight" numeric(12,2),
    "weight_override" numeric(6,5),
    "currency_code" character(3) DEFAULT 'EUR'::"bpchar" NOT NULL,
    "share_revenue" boolean DEFAULT true NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "monthly_capacity" numeric(12,2),
    CONSTRAINT "income_xor_weight" CHECK ((("income_or_weight" IS NULL) <> ("weight_override" IS NULL)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_personal_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_personal_expenses_amount_check" CHECK ((("amount" >= 0.01) AND ("amount" <= (999999)::numeric))),
    CONSTRAINT "user_personal_expenses_label_check" CHECK ((("char_length"("label") > 0) AND ("char_length"("label") <= 50)))
);


ALTER TABLE "public"."user_personal_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "test"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency_code" "text" DEFAULT 'EUR'::"text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "test"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "test"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "test"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "test"."groups" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "currency_code" "text" DEFAULT 'EUR'::"text",
    "creator_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "test"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "test"."profiles" (
    "id" "uuid" NOT NULL,
    "pseudo" "text" NOT NULL,
    "income_or_weight" numeric(12,2),
    "monthly_capacity" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "test"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "test"."user_personal_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "test"."user_personal_expenses" OWNER TO "postgres";


ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_personal_expenses"
    ADD CONSTRAINT "user_personal_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "test"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "test"."group_members"
    ADD CONSTRAINT "group_members_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "test"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "test"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "test"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "test"."user_personal_expenses"
    ADD CONSTRAINT "user_personal_expenses_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "group_members_user_uniq" ON "public"."group_members" USING "btree" ("group_id", "user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_expenses_created_by" ON "public"."expenses" USING "btree" ("created_by");



CREATE INDEX "idx_expenses_group_id" ON "public"."expenses" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_user_id" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_invitations_token" ON "public"."invitations" USING "btree" ("token");



CREATE INDEX "idx_profiles_deleted_at" ON "public"."profiles" USING "btree" ("deleted_at");



CREATE INDEX "idx_user_personal_expenses_user_id" ON "public"."user_personal_expenses" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "expenses_currency_guard" BEFORE INSERT OR UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_group_currency"();



CREATE OR REPLACE TRIGGER "expenses_set_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "groups_set_updated_at" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at_user_personal_expenses" BEFORE UPDATE ON "public"."user_personal_expenses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_capacity_after_delete" AFTER DELETE ON "public"."user_personal_expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_capacity_on_expense_change"();



CREATE OR REPLACE TRIGGER "trigger_capacity_after_income_update" AFTER UPDATE OF "income_or_weight" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_capacity_on_income_change"();



CREATE OR REPLACE TRIGGER "trigger_capacity_after_insert" AFTER INSERT ON "public"."user_personal_expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_capacity_on_expense_change"();



CREATE OR REPLACE TRIGGER "trigger_capacity_after_update" AFTER UPDATE ON "public"."user_personal_expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_capacity_on_expense_change"();



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_personal_expenses"
    ADD CONSTRAINT "user_personal_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "test"."expenses"
    ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "test"."profiles"("id");



ALTER TABLE ONLY "test"."expenses"
    ADD CONSTRAINT "expenses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "test"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "test"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "test"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "test"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "test"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "test"."groups"
    ADD CONSTRAINT "groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "test"."profiles"("id");



ALTER TABLE ONLY "test"."user_personal_expenses"
    ADD CONSTRAINT "user_personal_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "test"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "expenses_delete_if_creator" ON "public"."expenses" FOR DELETE TO "authenticated" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "expenses_insert_if_member" ON "public"."expenses" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "expenses"."group_id") AND ("group_members"."user_id" = "auth"."uid"())))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "expenses_select_if_member" ON "public"."expenses" FOR SELECT TO "authenticated" USING (("group_id" IN ( SELECT "group_members"."group_id"
   FROM "public"."group_members"
  WHERE ("group_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "expenses_update_if_creator" ON "public"."expenses" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "group_members_delete_self_or_creator" ON "public"."group_members" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("group_id" IN ( SELECT "groups"."id"
   FROM "public"."groups"
  WHERE ("groups"."creator_id" = "auth"."uid"())))));



CREATE POLICY "group_members_select_if_related" ON "public"."group_members" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "groups_delete_if_creator" ON "public"."groups" FOR DELETE TO "authenticated" USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "groups_insert_as_creator" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "groups_select_if_member" ON "public"."groups" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "groups"."id") AND ("group_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "groups_update_if_creator" ON "public"."groups" FOR UPDATE TO "authenticated" USING (("creator_id" = "auth"."uid"())) WITH CHECK (("creator_id" = "auth"."uid"()));



ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invitations_insert_own" ON "public"."invitations" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) AND ("deleted_at" IS NULL))) WITH CHECK ((("id" = "auth"."uid"()) AND ("deleted_at" IS NULL)));



ALTER TABLE "public"."user_personal_expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_personal_expenses_delete_own" ON "public"."user_personal_expenses" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_personal_expenses_insert_own" ON "public"."user_personal_expenses" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "user_personal_expenses_select_own" ON "public"."user_personal_expenses" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_personal_expenses_update_own" ON "public"."user_personal_expenses" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."expenses";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."group_members";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "test" TO "anon";
GRANT USAGE ON SCHEMA "test" TO "authenticated";
GRANT USAGE ON SCHEMA "test" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."accept_invite"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_invite"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_invite"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_phantom_member"("p_group_id" "uuid", "p_pseudo" "text", "p_income" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."add_phantom_member"("p_group_id" "uuid", "p_pseudo" "text", "p_income" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_phantom_member"("p_group_id" "uuid", "p_pseudo" "text", "p_income" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_user_capacity"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_user_capacity"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_user_capacity"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_onboarding"("p_pseudo" "text", "p_income" numeric, "p_group_name" "text", "p_expenses" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_onboarding"("p_pseudo" "text", "p_income" numeric, "p_group_name" "text", "p_expenses" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_onboarding"("p_pseudo" "text", "p_income" numeric, "p_group_name" "text", "p_expenses" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."compute_shares"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_shares"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_shares"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_group"("p_name" "text", "p_currency_code" character) TO "anon";
GRANT ALL ON FUNCTION "public"."create_group"("p_name" "text", "p_currency_code" character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_group"("p_name" "text", "p_currency_code" character) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_expense"("p_expense_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_expense"("p_expense_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_expense"("p_expense_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_group"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_group"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_group"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_group_currency"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_group_currency"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_group_currency"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_group_members"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_group_members"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_group_members"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invitation_details"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_invitation_details"("p_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invitation_details"("p_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_group"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."leave_group"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_group"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_group_member"("p_group_id" "uuid", "p_member_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_group_member"("p_group_id" "uuid", "p_member_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_group_member"("p_group_id" "uuid", "p_member_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_capacity_on_expense_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_capacity_on_expense_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_capacity_on_expense_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_capacity_on_income_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_capacity_on_income_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_capacity_on_income_change"() TO "service_role";



GRANT ALL ON FUNCTION "test"."calculate_user_capacity"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "test"."calculate_user_capacity"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "test"."calculate_user_capacity"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "test"."compute_shares"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "test"."compute_shares"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "test"."compute_shares"("p_group_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_personal_expenses" TO "anon";
GRANT ALL ON TABLE "public"."user_personal_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."user_personal_expenses" TO "service_role";



GRANT ALL ON TABLE "test"."expenses" TO "anon";
GRANT ALL ON TABLE "test"."expenses" TO "authenticated";
GRANT ALL ON TABLE "test"."expenses" TO "service_role";



GRANT ALL ON TABLE "test"."group_members" TO "anon";
GRANT ALL ON TABLE "test"."group_members" TO "authenticated";
GRANT ALL ON TABLE "test"."group_members" TO "service_role";



GRANT ALL ON TABLE "test"."groups" TO "anon";
GRANT ALL ON TABLE "test"."groups" TO "authenticated";
GRANT ALL ON TABLE "test"."groups" TO "service_role";



GRANT ALL ON TABLE "test"."profiles" TO "anon";
GRANT ALL ON TABLE "test"."profiles" TO "authenticated";
GRANT ALL ON TABLE "test"."profiles" TO "service_role";



GRANT ALL ON TABLE "test"."user_personal_expenses" TO "anon";
GRANT ALL ON TABLE "test"."user_personal_expenses" TO "authenticated";
GRANT ALL ON TABLE "test"."user_personal_expenses" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "test" GRANT ALL ON TABLES TO "service_role";




























RESET ALL;

