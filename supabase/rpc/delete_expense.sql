CREATE OR REPLACE FUNCTION public.delete_expense(
  p_expense_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id UUID;
  v_is_member BOOLEAN;
BEGIN
  SET search_path = public;

  -- Get group_id from expense
  SELECT group_id INTO v_group_id
  FROM public.expenses
  WHERE id = p_expense_id;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Dépense non trouvée';
  END IF;

  -- Check if user is member of the group
  SELECT EXISTS(
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id AND user_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Vous devez être membre du groupe pour supprimer cette dépense';
  END IF;

  -- Delete the expense
  DELETE FROM public.expenses WHERE id = p_expense_id;

  RETURN json_build_object('success', true);
END;
$$;
