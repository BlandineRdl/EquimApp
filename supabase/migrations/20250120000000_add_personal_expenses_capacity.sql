-- Personal Expenses & Capacity Calculation Migration
-- Adds user_personal_expenses table and monthly_capacity column to profiles

-- =============================================================================
-- TABLE: user_personal_expenses
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_personal_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(label) > 0 AND char_length(label) <= 50),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0.01 AND amount <= 999999),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user expense lookups
CREATE INDEX IF NOT EXISTS idx_user_personal_expenses_user_id
  ON public.user_personal_expenses(user_id);

-- =============================================================================
-- ALTER TABLE: profiles
-- =============================================================================

-- Add monthly_capacity column to profiles (nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_capacity NUMERIC(12,2);

-- =============================================================================
-- FUNCTION: calculate_user_capacity
-- =============================================================================

-- Function to recalculate user capacity (income - sum of expenses)
CREATE OR REPLACE FUNCTION public.calculate_user_capacity(p_user_id UUID)
RETURNS NUMERIC(12,2)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- =============================================================================
-- FUNCTION: update_capacity_on_expense_change (Trigger Function)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_capacity_on_expense_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger to update capacity when expense is added
CREATE TRIGGER trigger_capacity_after_insert
  AFTER INSERT ON public.user_personal_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_capacity_on_expense_change();

-- Trigger to update capacity when expense is updated
CREATE TRIGGER trigger_capacity_after_update
  AFTER UPDATE ON public.user_personal_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_capacity_on_expense_change();

-- Trigger to update capacity when expense is deleted
CREATE TRIGGER trigger_capacity_after_delete
  AFTER DELETE ON public.user_personal_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_capacity_on_expense_change();

-- Trigger to update updated_at timestamp
CREATE TRIGGER set_updated_at_user_personal_expenses
  BEFORE UPDATE ON public.user_personal_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on user_personal_expenses
ALTER TABLE public.user_personal_expenses ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own expenses
CREATE POLICY user_personal_expenses_insert_own
  ON public.user_personal_expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can only select their own expenses
CREATE POLICY user_personal_expenses_select_own
  ON public.user_personal_expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can only update their own expenses
CREATE POLICY user_personal_expenses_update_own
  ON public.user_personal_expenses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can only delete their own expenses
CREATE POLICY user_personal_expenses_delete_own
  ON public.user_personal_expenses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_personal_expenses TO authenticated;

-- Note: No sequence needed as we use gen_random_uuid() for primary key
