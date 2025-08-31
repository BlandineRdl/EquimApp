// src/features/onboarding/usecases/completeOnboarding.usecase.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type {
  CompleteOnboardingResult,
  OnboardingGateway,
} from "../../ports/onboarding.gateway";

export const completeOnboarding = createAsyncThunk<
  CompleteOnboardingResult,
  void,
  {
    state: AppState;
    extra: { onboardingGateway: OnboardingGateway };
  }
>(
  "onboarding/complete",
  async (_, { getState, extra: { onboardingGateway } }) => {
    const state = getState();
    const onboarding = state.onboarding;

    const filteredExpenses = onboarding.expenses.filter(
      (expense) => parseFloat(expense.amount) > 0,
    );

    const onboardingData = {
      userProfile: {
        pseudo: onboarding.pseudo.trim(),
        monthlyIncome: parseFloat(onboarding.monthlyIncome) || 0,
        shareRevenue: true,
      },
      group: {
        name: onboarding.groupName.trim(),
        expenses: filteredExpenses.map((expense) => ({
          id: expense.id,
          label: expense.label,
          amount: expense.amount,
          isCustom: expense.isCustom,
        })),

        totalMonthlyBudget: filteredExpenses.reduce(
          (total, expense) => total + parseFloat(expense.amount),
          0,
        ),
      },
    };

    return onboardingGateway.completeOnboarding(onboardingData);
  },
);
