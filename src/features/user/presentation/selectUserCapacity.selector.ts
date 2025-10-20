import type { AppState } from "../../../store/appState";

export const selectUserCapacity = (state: AppState): number | undefined => {
  return state.user.profile?.capacity;
};
