# Supabase Database Setup for EquimApp

This directory contains all SQL scripts needed to set up the EquimApp database on Supabase.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project in **EU region** (GDPR compliance)
3. Note your project URL and anon key

## Setup Instructions

### Step 1: Manual Configuration in Supabase Dashboard

1. **Enable Email Authentication**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Configure email templates (optional)

2. **Configure Redirect URLs**
   - Go to Authentication → URL Configuration
   - Add redirect URL: `equimapp://auth`

### Step 2: Run SQL Scripts in Order

Execute these scripts in the Supabase SQL Editor (in this exact order):

1. **Schema & RLS**
   ```sql
   -- Run: schema.sql
   ```
   Creates tables, indexes, and RLS policies

2. **Triggers**
   ```sql
   -- Run: triggers/set_updated_at.sql
   -- Run: triggers/enforce_group_currency.sql
   ```
   Sets up automated timestamp updates and currency validation

3. **RPC Functions** (order matters due to dependencies)
   ```sql
   -- Run: rpc/compute_shares.sql
   -- Run: rpc/create_group.sql
   -- Run: rpc/complete_onboarding.sql
   -- Run: rpc/leave_group.sql
   -- Run: rpc/accept_invite.sql
   -- Run: rpc/get_invitation_details.sql
   -- Run: rpc/get_group_members.sql
   ```

4. **Seed Data** (optional, for testing)
   ```sql
   -- First, create 2 test users via Supabase Auth UI
   -- Update UUIDs in seed.sql with actual auth.user IDs
   -- Run: seed.sql
   ```

### Step 3: Verify Setup

Run these checks in SQL Editor:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'groups', 'group_members', 'expenses', 'invitations');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- Check RPC functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'compute_shares',
    'create_group',
    'complete_onboarding',
    'leave_group',
    'accept_invite',
    'get_invitation_details',
    'get_group_members'
  );

-- Check Realtime is enabled on expenses and group_members
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

### Step 4: Environment Variables

Add these to your app's environment:

```bash
# .env.development (for local/test)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# .env.production (for prod builds)
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key-here
```

**⚠️ IMPORTANT**: Never commit `.env` files to git! Add them to `.gitignore`.

## Architecture Overview

### Tables

- **profiles**: User profiles (extends auth.users)
- **groups**: Expense sharing groups
- **group_members**: Many-to-many relationship between users and groups
- **expenses**: Group expenses
- **invitations**: Invitation tokens for joining groups

### Key Security Features

- ✅ **RLS on all tables**: Users can only see their own data or data from groups they're members of
- ✅ **No direct SELECT on invitations**: Prevents token leakage
- ✅ **Atomic RPC transactions**: Prevents data inconsistencies
- ✅ **SECURITY DEFINER + SET search_path**: Prevents SQL injection via shadowing
- ✅ **Cryptographic tokens**: 32-byte random tokens for invitations
- ✅ **Soft delete**: GDPR-compliant account deletion (anonymization)

### RPC Functions

1. **compute_shares(group_id)**: Calculate fair expense shares based on income
2. **create_group(name, currency)**: Atomically create group + add creator as member
3. **complete_onboarding(pseudo, income, group_name, expenses)**: Complete user onboarding in one transaction
4. **leave_group(group_id)**: Leave group + delete if last member
5. **accept_invite(token)**: Accept invitation (single-use, validated)
6. **get_invitation_details(token)**: Preview invitation (safe for anon users)
7. **get_group_members(group_id)**: Get member list with pseudos (bypasses RLS securely)

## Testing

### Manual Testing via SQL Editor

```sql
-- Test compute_shares
SELECT public.compute_shares('your-group-uuid-here');

-- Test create_group (requires authenticated context - use from app)
-- SELECT public.create_group('Test Group', 'EUR');

-- Test get_invitation_details (works without auth)
SELECT public.get_invitation_details('test-token-here');
```

### Testing from App

1. Run seed.sql to create test data
2. Use Supabase Auth to sign in as Alice or Bob
3. Test all user flows from app

## Troubleshooting

### Common Issues

**RLS blocks my query**
- Check you're authenticated (`auth.uid()` returns non-null)
- Verify you're a member of the group you're trying to access

**RPC function not found**
- Run the RPC scripts again
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'function_name';`

**Invitation token doesn't work**
- Check token hasn't expired (`expires_at < NOW()`)
- Check token hasn't been consumed (`consumed_at IS NOT NULL`)

**Can't see other members' pseudos**
- Use `get_group_members` RPC instead of direct SELECT
- Direct SELECT on profiles is blocked by RLS (intentional)

## Production Checklist

Before deploying to production:

- [ ] All SQL scripts executed successfully
- [ ] RLS policies verified (test with different users)
- [ ] Realtime enabled on expenses and group_members
- [ ] Environment variables configured
- [ ] Seed data removed (or use separate test project)
- [ ] Database backups enabled in Supabase dashboard
- [ ] Monitor Supabase metrics (API calls, DB size)

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- EquimApp Repo: [Your GitHub repo URL]
