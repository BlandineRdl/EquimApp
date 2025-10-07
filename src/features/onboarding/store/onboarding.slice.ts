// src/features/onboarding/store/onboarding.slice.ts
import { createSlice } from "@reduxjs/toolkit";
import { PREDEFINED_EXPENSES } from "../domain/expense.model";
import type { OnboardingExpense } from "../domain/onboarding.model";
import { completeOnboarding } from "../usecases/complete-onboarding/completeOnboarding.usecase";

interface OnboardingState {
  // Données du formulaire (temporaires)
  pseudo: string;
  pseudoBlurred: boolean;
  monthlyIncome: string;
  incomeBlurred: boolean;
  groupName: string;
  groupNameBlurred: boolean;
  expenses: OnboardingExpense[];

  // État de la completion
  completing: boolean;
  completed: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  // Form data
  pseudo: "",
  pseudoBlurred: false,
  monthlyIncome: "",
  incomeBlurred: false,
  groupName: "",
  groupNameBlurred: false,
  expenses: [...PREDEFINED_EXPENSES],

  // Completion state
  completing: false,
  completed: false,
  error: null,
};

export const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    // Form actions (inchangées)
    setPseudo: (state, action) => {
      state.pseudo = action.payload;
    },
    blurPseudo: (state) => {
      state.pseudoBlurred = true;
    },
    setMonthlyIncome: (state, action) => {
      state.monthlyIncome = action.payload;
    },
    blurIncome: (state) => {
      state.incomeBlurred = true;
    },
    setGroupName: (state, action) => {
      state.groupName = action.payload;
    },
    blurGroupName: (state) => {
      state.groupNameBlurred = true;
    },
    updateExpenseAmount: (state, action) => {
      const { id, amount } = action.payload;
      const expense = state.expenses.find((e) => e.id === id);
      if (expense) {
        expense.amount = amount;
      }
    },
    addCustomExpense: (state, action) => {
      const { label, amount } = action.payload;
      const id = `custom-${label}`;
      state.expenses.push({ id, label, amount, isCustom: true });
    },
    removeCustomExpense: (state, action) => {
      const index = action.payload;
      state.expenses.splice(index, 1);
    },

    // Reset onboarding
    resetOnboarding: (_state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Complete Onboarding
      .addCase(completeOnboarding.pending, (state) => {
        state.completing = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.completing = false;
        state.completed = true;
        // Les données user/group sont maintenant dans leurs slices respectives
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.completing = false;
        state.error =
          action.error.message || "Erreur lors de la création du compte";
      });
  },
});

export const {
  setPseudo,
  blurPseudo,
  setMonthlyIncome,
  blurIncome,
  setGroupName,
  blurGroupName,
  updateExpenseAmount,
  addCustomExpense,
  removeCustomExpense,
  resetOnboarding,
} = onboardingSlice.actions;

export const onboardingReducer = onboardingSlice.reducer;
