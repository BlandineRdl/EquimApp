import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../store/appState";

export type NavigationState =
  | "INITIALIZING"
  | "UNAUTHENTICATED"
  | "AUTHENTICATED_ONBOARDING_INCOMPLETE"
  | "AUTHENTICATED_ONBOARDING_COMPLETE";

const selectAuth = (state: AppState) => state.auth;
const selectUser = (state: AppState) => state.user;

export const selectNavigationState = createSelector(
  [selectAuth, selectUser],
  (auth, user): NavigationState => {
    if (auth.isLoading || user.loading) {
      return "INITIALIZING";
    }

    if (!auth.isAuthenticated) {
      return "UNAUTHENTICATED";
    }

    if (!user.profile) {
      return "AUTHENTICATED_ONBOARDING_INCOMPLETE";
    }

    return "AUTHENTICATED_ONBOARDING_COMPLETE";
  },
);

export const selectTargetRoute = createSelector(
  [selectNavigationState],
  (navState): string => {
    switch (navState) {
      case "INITIALIZING":
        return "/splash";
      case "UNAUTHENTICATED":
        return "/auth/sign-in";
      case "AUTHENTICATED_ONBOARDING_INCOMPLETE":
        return "/";
      case "AUTHENTICATED_ONBOARDING_COMPLETE":
        return "/home";
    }
  },
);
