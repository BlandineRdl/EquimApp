-- Migration: Add ON DELETE CASCADE constraints for user account deletion
-- Date: 2025-10-21
-- Purpose: Ensure all user data is automatically deleted when profile is deleted

-- 1. Drop existing foreign key constraints that need to be updated
ALTER TABLE public.group_members
  DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

ALTER TABLE public.groups
  DROP CONSTRAINT IF EXISTS groups_creator_id_fkey;

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_created_by_fkey;

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_accepted_by_fkey;

-- 2. Re-add constraints with ON DELETE CASCADE

-- When a profile is deleted, remove user from all groups they're a member of
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- When a profile is deleted, delete all groups they created
-- (This will cascade to group_members, expenses, invitations via existing constraints)
ALTER TABLE public.groups
  ADD CONSTRAINT groups_creator_id_fkey
  FOREIGN KEY (creator_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- When a profile is deleted, delete all invitations they created
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- When a profile is deleted, nullify accepted_by in invitations
-- (We keep the invitation record for history, but remove the user reference)
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_accepted_by_fkey
  FOREIGN KEY (accepted_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Note: user_personal_expenses already has ON DELETE CASCADE (line 1297 in initial schema)
-- Note: profiles.id -> auth.users.id already has ON DELETE CASCADE (line 1292 in initial schema)
