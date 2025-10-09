import { createSelector } from "@reduxjs/toolkit";
import type { AppState } from "../store/appState";

/**
 * Navigation states based on authentication and profile status
 */
export type NavigationState =
  | "INITIALIZING"
  | "UNAUTHENTICATED"
  | "AUTHENTICATED_ONBOARDING_INCOMPLETE"
  | "AUTHENTICATED_ONBOARDING_COMPLETE";

const selectAuth = (state: AppState) => state.auth;
const selectUser = (state: AppState) => state.user;

/**
 * Determines the current navigation state based on auth and user state
 */
export const selectNavigationState = createSelector(
  [selectAuth, selectUser],
  (auth, user): NavigationState => {
    // Still loading auth or profile
    if (auth.isLoading || user.loading) {
      return "INITIALIZING";
    }

    // Not authenticated
    if (!auth.isAuthenticated) {
      return "UNAUTHENTICATED";
    }

    // Authenticated but no profile (needs onboarding)
    if (!user.profile) {
      return "AUTHENTICATED_ONBOARDING_INCOMPLETE";
    }

    // Authenticated with complete profile
    return "AUTHENTICATED_ONBOARDING_COMPLETE";
  },
);

/**
 * Returns the target route based on navigation state
 */
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
