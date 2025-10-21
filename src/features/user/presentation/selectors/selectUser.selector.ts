// src/features/user/presentation/selectors/selectUser.selector.ts
import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";

const selectUserState = (state: AppState) => state.user;

// Selectors de base
export const selectUserProfile = createSelector(
  [selectUserState],
  (user) => user.profile,
);

export const selectUserLoading = createSelector(
  [selectUserState],
  (user) => user.loading,
);

export const selectUserError = createSelector(
  [selectUserState],
  (user) => user.error,
);

// Selectors composés pour l'UI
export const selectUserUI = createSelector(
  [selectUserProfile, selectUserLoading, selectUserError],
  (profile, loading, error) => ({
    profile,
    loading,
    error,
    isLoaded: !!profile && !loading,
    pseudo: profile?.pseudo || null,
    monthlyIncome: profile?.monthlyIncome || 0,
    hasProfile: !!profile,
  }),
);
