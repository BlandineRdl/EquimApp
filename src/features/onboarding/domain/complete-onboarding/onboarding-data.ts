import type { Expense } from "../manage-predefined-expenses/predefined-expense";

export interface OnboardingUserProfile {
  pseudo: string;
  monthlyIncome: number;
  shareRevenue: boolean;
}

export interface OnboardingGroup {
  name: string;
  expenses: Expense[];
  totalMonthlyBudget: number;
}

export interface OnboardingData {
  userProfile: OnboardingUserProfile;
  group: OnboardingGroup;
}
