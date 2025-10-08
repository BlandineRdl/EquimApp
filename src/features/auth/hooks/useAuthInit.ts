import { useEffect } from "react";
import { useSelector } from "react-redux";

import { logger } from "../../../lib/logger";
import { setupAuthDeepLinking } from "../../../lib/supabase/auth";
import type { AppState } from "../../../store/appState";
import { useAppDispatch } from "../../../store/buildReduxStore";
import { loadUserProfile } from "../../user/usecases/loadUserProfile.usecase";
import { setSession } from "../store/authSlice";
import { initSession } from "../usecases/initSession.usecase";

/**
 * Hook to initialize auth on app startup
 * - Restores session from AsyncStorage
 * - Listens for auth state changes
 * - Handles deep linking for magic links
 * - Loads user profile when authenticated
 */
export function useAuthInit() {
  const dispatch = useAppDispatch();
  const isLoading = useSelector((state: AppState) => state.auth.isLoading);
  const isAuthenticated = useSelector(
    (state: AppState) => state.auth.isAuthenticated,
  );

  useEffect(() => {
    // Initialize session
    dispatch(initSession());

    // Setup deep linking for magic link authentication
    const removeDeepLinkListener = setupAuthDeepLinking();

    // Listen for auth state changes
    const { unsubscribe } = dispatch((_, _getState, { authGateway }) => {
      return authGateway.onAuthStateChange((session) => {
        dispatch(setSession(session));
      });
    });

    // Cleanup
    return () => {
      removeDeepLinkListener();
      unsubscribe();
    };
  }, [dispatch]);

  // Load user profile when authenticated
  useEffect(() => {
    logger.debug("Auth status changed", { isAuthenticated });
    if (isAuthenticated) {
      logger.info("User authenticated, loading profile");
      dispatch(loadUserProfile());
    }
  }, [isAuthenticated, dispatch]);

  return { isLoading };
}
