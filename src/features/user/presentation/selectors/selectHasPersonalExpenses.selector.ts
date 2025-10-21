import type { AppState } from "../../../../store/appState";

export const selectHasPersonalExpenses = (state: AppState): boolean => {
  const expenses = state.user.profile?.personalExpenses || [];
  return expenses.length > 0;
};
