-- Migration: Add DELETE policy for profiles table
-- Date: 2025-10-21
-- Purpose: Allow users to delete their own profile (required for account reset)
-- Note: This policy should be controlled by feature flags in production

-- Add DELETE policy to allow authenticated users to delete their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());
