import type { PersonalExpense } from "../manage-personal-expenses/personal-expense";

/**
 * User Profile - Entité métier représentant un utilisateur
 */
export interface User {
  id: string;
  pseudo: string;
  monthlyIncome: number;
  shareRevenue: boolean;
  currency: string;
  personalExpenses?: PersonalExpense[];
  capacity?: number;
}
