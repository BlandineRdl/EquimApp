import { createSlice } from "@reduxjs/toolkit";

interface Expense {
  label: string;
  amount: string;
  isCustom: boolean;
}

interface OnboardingState {
  pseudo: string;
  pseudoBlurred: boolean;
  monthlyIncome: string;
  incomeBlurred: boolean;
  groupName: string;
  groupNameBlurred: boolean;
  expenses: Expense[];
}

const initialState: OnboardingState = {
  pseudo: "",
  pseudoBlurred: false,
  monthlyIncome: "",
  incomeBlurred: false,
  groupName: "",
  groupNameBlurred: false,
  expenses: [
    { label: "Loyer", amount: "", isCustom: false },
    { label: "Courses", amount: "", isCustom: false },
    { label: "Électricité", amount: "", isCustom: false },
    { label: "Internet", amount: "", isCustom: false },
  ],
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
      const { index, amount } = action.payload;
      state.expenses[index].amount = amount;
    },
    addCustomExpense: (state, action) => {
      const { label, amount } = action.payload;
      state.expenses.push({ label, amount, isCustom: true });
    },
    removeCustomExpense: (state, action) => {
      const index = action.payload;
      state.expenses.splice(index, 1);
    },
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
} = onboardingSlice.actions;
export const onboardingReducer = onboardingSlice.reducer;
