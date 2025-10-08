-- Seed data for testing EquimApp MVP
-- Creates sample users, groups, expenses, and invitations

-- NOTE: This seed assumes you have manually created 2 test auth.users via Supabase Auth
-- Replace these UUIDs with actual auth.user IDs from your Supabase project

DO $$
DECLARE
  v_alice_id UUID := '00000000-0000-0000-0000-000000000001'; -- Replace with actual Alice auth.user.id
  v_bob_id UUID := '00000000-0000-0000-0000-000000000002';   -- Replace with actual Bob auth.user.id
  v_group_id UUID;
  v_invitation_token TEXT;
BEGIN
  -- Clean existing seed data (if any)
  DELETE FROM public.invitations WHERE created_by IN (v_alice_id, v_bob_id);
  DELETE FROM public.expenses WHERE created_by IN (v_alice_id, v_bob_id);
  DELETE FROM public.group_members WHERE user_id IN (v_alice_id, v_bob_id);
  DELETE FROM public.groups WHERE creator_id IN (v_alice_id, v_bob_id);
  DELETE FROM public.profiles WHERE id IN (v_alice_id, v_bob_id);

  -- Create Alice's profile
  INSERT INTO public.profiles (id, pseudo, income_or_weight, currency_code, share_revenue)
  VALUES (v_alice_id, 'Alice', 3000.00, 'EUR', true);

  -- Create Bob's profile
  INSERT INTO public.profiles (id, pseudo, income_or_weight, currency_code, share_revenue)
  VALUES (v_bob_id, 'Bob', 2000.00, 'EUR', true);

  -- Create a test group (Alice as creator)
  INSERT INTO public.groups (name, creator_id, currency_code)
  VALUES ('Household', v_alice_id, 'EUR')
  RETURNING id INTO v_group_id;

  -- Add Alice and Bob as members
  INSERT INTO public.group_members (group_id, user_id)
  VALUES
    (v_group_id, v_alice_id),
    (v_group_id, v_bob_id);

  -- Add sample expenses
  INSERT INTO public.expenses (group_id, name, amount, currency_code, is_predefined, created_by)
  VALUES
    (v_group_id, 'Rent', 1200.00, 'EUR', true, v_alice_id),
    (v_group_id, 'Groceries', 300.00, 'EUR', true, v_alice_id),
    (v_group_id, 'Internet', 50.00, 'EUR', true, v_bob_id);

  -- Generate a cryptographic invitation token (32 bytes base64url)
  v_invitation_token := encode(gen_random_bytes(32), 'base64');
  v_invitation_token := replace(replace(v_invitation_token, '/', '_'), '+', '-');
  v_invitation_token := rtrim(v_invitation_token, '='); -- Remove padding

  -- Create an invitation (expires in 7 days)
  INSERT INTO public.invitations (group_id, token, created_by, expires_at)
  VALUES (v_group_id, v_invitation_token, v_alice_id, NOW() + INTERVAL '7 days');

  RAISE NOTICE 'Seed data created successfully!';
  RAISE NOTICE 'Test invitation token: %', v_invitation_token;
  RAISE NOTICE 'Invitation link: equimapp://invite/%', v_invitation_token;
END $$;
