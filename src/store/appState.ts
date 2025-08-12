interface Expense {
  label: string;
  amount: string;
  isCustom: boolean;
}

export interface AppState {
  onboarding: {
    pseudo: string;
    pseudoBlurred: boolean;
    monthlyIncome: string;
    incomeBlurred: boolean;
    groupName: string;
    groupNameBlurred: boolean;
    expenses: Expense[];
  };
}
