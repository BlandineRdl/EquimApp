import type { PersonalExpense } from "../manage-personal-expenses/personal-expense";

export function calculateCapacity(
  income: number,
  expenses: PersonalExpense[],
): number {
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  return income - totalExpenses;
}
