// src/features/onboarding/store/onboarding.slice.ts
import { createSlice } from "@reduxjs/toolkit";
import { PREDEFINED_EXPENSES } from "../domain/manage-predefined-expenses/predefined-expense.constants";
import { completeOnboarding } from "../usecases/complete-onboarding/completeOnboarding.usecase";

// Type spécifique au formulaire (amount en string pour l'input utilisateur)
interface OnboardingExpense {
  id: string;
  label: string;
  amount: string; // string car c'est un input formulaire
  isCustom: boolean;
}

interface PersonalExpenseInput {
  label: string;
  amount: number;
}

interface OnboardingState {
  // Données du formulaire (temporaires)
  pseudo: string;
  pseudoBlurred: boolean;
  monthlyIncome: string;
  incomeBlurred: boolean;
  groupName: string;
  groupNameBlurred: boolean;
  expenses: OnboardingExpense[];
  personalExpenses: PersonalExpenseInput[]; // NEW: for storing expenses during onboarding
  skipGroupCreation: boolean; // NEW: track if user chose to skip group creation

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
  // Map PREDEFINED_EXPENSES (number) to OnboardingExpense (string for form)
  expenses: PREDEFINED_EXPENSES.map((expense) => ({
    ...expense,
    amount: String(expense.amount),
  })),
  personalExpenses: [], // NEW
  skipGroupCreation: false, // NEW

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

    // NEW: Store personal expenses during onboarding
    setPersonalExpenses: (
      state,
      action: { payload: PersonalExpenseInput[] },
    ) => {
      state.personalExpenses = action.payload;
    },

    // NEW: Set skip group creation flag
    setSkipGroupCreation: (state, action: { payload: boolean }) => {
      state.skipGroupCreation = action.payload;
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
  setPersonalExpenses, // NEW
  setSkipGroupCreation, // NEW
  resetOnboarding,
} = onboardingSlice.actions;

export const onboardingReducer = onboardingSlice.reducer;
