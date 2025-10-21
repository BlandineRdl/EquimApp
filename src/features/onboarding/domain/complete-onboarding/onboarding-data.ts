import type { Expense } from "../manage-predefined-expenses/predefined-expense";

/**
 * Profil utilisateur lors de l'onboarding
 */
export interface OnboardingUserProfile {
  pseudo: string;
  monthlyIncome: number;
  shareRevenue: boolean;
}

/**
 * Groupe créé lors de l'onboarding
 */
export interface OnboardingGroup {
  name: string;
  expenses: Expense[];
  totalMonthlyBudget: number;
}

/**
 * Données complètes de l'onboarding
 */
export interface OnboardingData {
  userProfile: OnboardingUserProfile;
  group: OnboardingGroup;
}
