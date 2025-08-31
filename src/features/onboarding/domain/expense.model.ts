export enum PredefinedExpenseType {
  RENT = "rent",
  GROCERIES = "groceries",
  ELECTRICITY = "electricity",
  INTERNET = "internet",
}

export interface Expense {
  id: string;
  label: string;
  amount: string;
  isCustom: boolean;
  type?: PredefinedExpenseType;
}

export const PREDEFINED_EXPENSES: Readonly<Expense[]> = [
  {
    id: PredefinedExpenseType.RENT,
    label: "Loyer",
    amount: "",
    isCustom: false,
    type: PredefinedExpenseType.RENT,
  },
  {
    id: PredefinedExpenseType.GROCERIES,
    label: "Courses",
    amount: "",
    isCustom: false,
    type: PredefinedExpenseType.GROCERIES,
  },
  {
    id: PredefinedExpenseType.ELECTRICITY,
    label: "Électricité",
    amount: "",
    isCustom: false,
    type: PredefinedExpenseType.ELECTRICITY,
  },
  {
    id: PredefinedExpenseType.INTERNET,
    label: "Internet",
    amount: "",
    isCustom: false,
    type: PredefinedExpenseType.INTERNET,
  },
] as const;
