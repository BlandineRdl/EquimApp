export interface OnboardingUserProfile {
  pseudo: string;
  monthlyIncome: number;
  shareRevenue: boolean;
}

export interface OnboardingExpense {
  id: string;
  label: string;
  amount: string;
  isCustom: boolean;
}

export interface OnboardingGroup {
  name: string;
  expenses: OnboardingExpense[];
  totalMonthlyBudget: number;
}

export interface OnboardingData {
  userProfile: OnboardingUserProfile;
  group: OnboardingGroup;
}
