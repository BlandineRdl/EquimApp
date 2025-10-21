export enum PredefinedExpenseType {
  RENT = "rent",
  GROCERIES = "groceries",
  ELECTRICITY = "electricity",
  INTERNET = "internet",
}

/**
 * Expense - Entité métier représentant une dépense lors de l'onboarding
 */
export interface Expense {
  id: string;
  label: string;
  amount: number; // ✅ Fixé: number au lieu de string
  isCustom: boolean;
  type?: PredefinedExpenseType;
}
