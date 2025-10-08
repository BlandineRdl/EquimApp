-- Trigger function to enforce that expense currency matches group currency
-- Prevents currency mismatch errors at database level

CREATE OR REPLACE FUNCTION public.enforce_group_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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
      USING ERRCODE = 'P0001',
            DETAIL = 'expense_currency_mismatch';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger to expenses table on INSERT and UPDATE
DROP TRIGGER IF EXISTS expenses_currency_guard ON public.expenses;
CREATE TRIGGER expenses_currency_guard
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_group_currency();
