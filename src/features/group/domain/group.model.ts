import type { Expense } from "../../onboarding/domain/expense.model";

export interface Group {
  id: string;
  name: string;
  expenses: Expense[];
  totalMonthlyBudget: number;
}
