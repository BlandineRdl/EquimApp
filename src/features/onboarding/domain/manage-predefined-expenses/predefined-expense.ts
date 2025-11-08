export enum PredefinedExpenseType {
  RENT = "rent",
  GROCERIES = "groceries",
  ELECTRICITY = "electricity",
  INTERNET = "internet",
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  isCustom: boolean;
  type?: PredefinedExpenseType;
}
