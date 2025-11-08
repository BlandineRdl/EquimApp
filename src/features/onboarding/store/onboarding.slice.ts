import { createSlice } from "@reduxjs/toolkit";
import type { AppError } from "../../../types/thunk.types";
import { PREDEFINED_EXPENSES } from "../domain/manage-predefined-expenses/predefined-expense.constants";
import { completeOnboarding } from "../usecases/complete-onboarding/completeOnboarding.usecase";

interface OnboardingExpense {
  id: string;
  label: string;
  amount: string;
  isCustom: boolean;
}

interface PersonalExpenseInput {
  label: string;
  amount: number;
}

interface OnboardingState {
  pseudo: string;
  pseudoBlurred: boolean;
  monthlyIncome: string;
  incomeBlurred: boolean;
  groupName: string;
  groupNameBlurred: boolean;
  expenses: OnboardingExpense[];
  personalExpenses: PersonalExpenseInput[];
  skipGroupCreation: boolean;

  completing: boolean;
  completed: boolean;
  error: AppError | null;
}

const initialState: OnboardingState = {
  pseudo: "",
  pseudoBlurred: false,
  monthlyIncome: "",
  incomeBlurred: false,
  groupName: "",
  groupNameBlurred: false,
  expenses: PREDEFINED_EXPENSES.map((expense) => ({
    ...expense,
    amount: String(expense.amount),
  })),
  personalExpenses: [],
  skipGroupCreation: false,

  completing: false,
  completed: false,
  error: null,
};

export const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
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
      const id = action.payload;
      state.expenses = state.expenses.filter((expense) => expense.id !== id);
    },

    setPersonalExpenses: (
      state,
      action: { payload: PersonalExpenseInput[] },
    ) => {
      state.personalExpenses = action.payload;
    },

    setSkipGroupCreation: (state, action: { payload: boolean }) => {
      state.skipGroupCreation = action.payload;
    },

    resetOnboarding: (_state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(completeOnboarding.pending, (state) => {
        state.completing = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.completing = false;
        state.completed = true;
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.completing = false;
        state.error = action.payload ?? {
          code: "COMPLETE_ONBOARDING_FAILED",
          message:
            action.error?.message ?? "Erreur lors de la création du compte",
        };
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
  setPersonalExpenses,
  setSkipGroupCreation,
  resetOnboarding,
} = onboardingSlice.actions;

export const onboardingReducer = onboardingSlice.reducer;
