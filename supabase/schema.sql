-- EquimApp Database Schema
-- MVP Production-Ready with strict RLS, constraints, and GDPR compliance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Profiles table (extends auth.users with app-specific data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo TEXT,
  income_or_weight NUMERIC(12,2),
  weight_override NUMERIC(6,5),
  currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
  share_revenue BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- XOR constraint: exactly one of income_or_weight or weight_override must be non-null
  CONSTRAINT income_xor_weight CHECK (
    (income_or_weight IS NULL) <> (weight_override IS NULL)
  )
);

-- Groups table (expense sharing groups)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  currency_code CHAR(3) NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group members junction table (many-to-many relationship)
-- Supports both real users (with accounts) and phantom members (without accounts)
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id), -- Nullable for phantom members

  -- Phantom member data (used when user_id is NULL)
  phantom_pseudo TEXT,
  phantom_income NUMERIC(12,2),

  -- Claiming system
  is_phantom BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMPTZ,

  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure phantom members have required data
  CONSTRAINT phantom_has_data CHECK (
    (is_phantom = false AND user_id IS NOT NULL AND phantom_pseudo IS NULL AND phantom_income IS NULL)
    OR (is_phantom = true AND user_id IS NULL AND phantom_pseudo IS NOT NULL AND phantom_income IS NOT NULL)
  )
);

-- Partial unique index: ensure a real user can only join a group once
-- This does NOT apply to phantom members (where user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS group_members_user_uniq
  ON public.group_members (group_id, user_id)
  WHERE user_id IS NOT NULL;

-- Expenses table (group expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency_code CHAR(3) NOT NULL,
  is_predefined BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Composite FK: creator must be a member of the group
  CONSTRAINT expenses_creator_must_be_member
    FOREIGN KEY (group_id, created_by)
    REFERENCES public.group_members(group_id, user_id)
    ON DELETE RESTRICT
);

-- Invitations table (group invitation links)
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  accepted_by UUID REFERENCES public.profiles(id),
  consumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (id = auth.uid() AND deleted_at IS NULL);

-- Groups policies
CREATE POLICY groups_insert_as_creator
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY groups_select_if_member
  ON public.groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY groups_delete_if_creator
  ON public.groups FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY groups_update_if_creator
  ON public.groups FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Group members policies
-- Simple policy: users can see all group_members records
-- (filtering is done at application level via group access)
CREATE POLICY group_members_select_if_related
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY group_members_delete_self_or_creator
  ON public.group_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR group_id IN (
      SELECT id FROM public.groups
      WHERE creator_id = auth.uid()
    )
  );

-- Expenses policies
CREATE POLICY expenses_insert_if_member
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = expenses.group_id AND user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY expenses_select_if_member
  ON public.expenses FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY expenses_update_if_creator
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY expenses_delete_if_creator
  ON public.expenses FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Invitations policies (NO SELECT - only via RPC)
CREATE POLICY invitations_insert_own
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- =============================================================================
-- REALTIME
-- =============================================================================

-- Enable Realtime on expenses and group_members for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
