import { type Expense, PredefinedExpenseType } from "./predefined-expense";

/**
 * Dépenses prédéfinies proposées lors de l'onboarding
 */
export const PREDEFINED_EXPENSES: Readonly<Expense[]> = [
  {
    id: PredefinedExpenseType.RENT,
    label: "Loyer",
    amount: 0,
    isCustom: false,
    type: PredefinedExpenseType.RENT,
  },
  {
    id: PredefinedExpenseType.GROCERIES,
    label: "Courses",
    amount: 0,
    isCustom: false,
    type: PredefinedExpenseType.GROCERIES,
  },
  {
    id: PredefinedExpenseType.ELECTRICITY,
    label: "Électricité",
    amount: 0,
    isCustom: false,
    type: PredefinedExpenseType.ELECTRICITY,
  },
  {
    id: PredefinedExpenseType.INTERNET,
    label: "Internet",
    amount: 0,
    isCustom: false,
    type: PredefinedExpenseType.INTERNET,
  },
] as const;
