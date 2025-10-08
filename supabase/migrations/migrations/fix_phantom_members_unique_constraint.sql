-- Fix UNIQUE constraint for phantom members
-- The constraint should only apply to real members (user_id NOT NULL)
-- Phantom members should be able to have multiple entries per group

-- Step 1: Drop the foreign key constraint on expenses (depends on the unique index)
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_creator_must_be_member;

-- Step 2: Drop the old unique constraint
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_user_uniq;

-- Step 3: Create a partial unique index that only applies when user_id is NOT NULL
-- This allows multiple phantom members (user_id = NULL) in the same group
CREATE UNIQUE INDEX group_members_user_uniq
  ON public.group_members (group_id, user_id)
  WHERE user_id IS NOT NULL;

-- Step 4: Recreate the foreign key constraint on expenses
-- Note: This constraint now only works for real members, not phantom members
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_creator_must_be_member
  FOREIGN KEY (group_id, created_by)
  REFERENCES public.group_members(group_id, user_id)
  ON DELETE RESTRICT;

-- Step 5: Add a CHECK constraint to ensure only real members can create expenses
-- (phantom members cannot create expenses)
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_creator_must_be_real_member
  CHECK (created_by IS NOT NULL);
