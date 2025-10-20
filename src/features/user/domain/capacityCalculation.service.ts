import type { PersonalExpense } from "./personalExpense.model";

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
