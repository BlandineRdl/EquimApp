-- Migration to add trigger for capacity recalculation when income changes
-- This ensures monthly_capacity is always up-to-date when income_or_weight is modified

-- Trigger function to update capacity when income changes
CREATE OR REPLACE FUNCTION public.update_capacity_on_income_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only recalculate if income_or_weight has changed
  IF NEW.income_or_weight IS DISTINCT FROM OLD.income_or_weight THEN
    PERFORM public.calculate_user_capacity(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update capacity when income is updated
CREATE TRIGGER trigger_capacity_after_income_update
  AFTER UPDATE OF income_or_weight ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_capacity_on_income_change();

-- Recalculate capacity for all existing users to fix current data
-- This is a one-time fix for users who already have income and expenses
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT DISTINCT p.id
    FROM public.profiles p
    WHERE p.income_or_weight IS NOT NULL
  LOOP
    PERFORM public.calculate_user_capacity(user_record.id);
  END LOOP;
END;
$$;
