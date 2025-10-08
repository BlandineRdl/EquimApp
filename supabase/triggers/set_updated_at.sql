-- Trigger function to automatically update updated_at timestamp
-- Used on tables that track modification time

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set search_path to prevent SQL injection via shadowing
  SET search_path = public;

  -- Update the updated_at column to current timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;

-- Apply trigger to expenses table
DROP TRIGGER IF EXISTS expenses_set_updated_at ON public.expenses;
CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Apply trigger to groups table
DROP TRIGGER IF EXISTS groups_set_updated_at ON public.groups;
CREATE TRIGGER groups_set_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
