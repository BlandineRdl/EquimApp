import type { PersonalExpense } from "../manage-personal-expenses/personal-expense";

export interface User {
  id: string;
  pseudo: string;
  monthlyIncome: number;
  shareRevenue: boolean;
  currency: string;
  personalExpenses?: PersonalExpense[];
  capacity?: number;
}
