import type { PersonalExpense } from "./personalExpense.model";

export interface User {
  id: string;
  pseudo: string;
  monthlyIncome: number;
  shareRevenue: boolean;
  personalExpenses?: PersonalExpense[];
  capacity?: number;
}
