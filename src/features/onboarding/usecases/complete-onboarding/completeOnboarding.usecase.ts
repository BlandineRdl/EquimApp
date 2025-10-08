// src/features/onboarding/usecases/completeOnboarding.usecase.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import type {
  CompleteOnboardingResult,
  OnboardingGateway,
} from "../../ports/OnboardingGateway";

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

    // Adapt to new CompleteOnboardingInput format
    const onboardingInput = {
      pseudo: onboarding.pseudo.trim(),
      income: parseFloat(onboarding.monthlyIncome) || 0,
      groupName: onboarding.groupName.trim(),
      expenses: filteredExpenses.map((expense) => ({
        name: expense.label,
        amount: parseFloat(expense.amount),
        isPredefined: !expense.isCustom,
      })),
    };

    return onboardingGateway.completeOnboarding(onboardingInput);
  },
);
