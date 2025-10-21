import type { AppState } from "../../../../store/appState";
import type { PersonalExpense } from "../../domain/manage-personal-expenses/personal-expense";

export const selectPersonalExpenses = (state: AppState): PersonalExpense[] => {
  return state.user.profile?.personalExpenses || [];
};
