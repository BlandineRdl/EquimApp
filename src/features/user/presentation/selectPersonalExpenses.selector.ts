import type { AppState } from "../../../store/appState";
import type { PersonalExpense } from "../domain/personalExpense.model";

export const selectPersonalExpenses = (state: AppState): PersonalExpense[] => {
  return state.user.profile?.personalExpenses || [];
};
