import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { logger } from "../../../lib/logger";
import { setupAuthDeepLinking } from "../../../lib/supabase/auth";
import type { AppState } from "../../../store/appState";
import { useAppDispatch } from "../../../store/buildReduxStore";
import { loadUserProfile } from "../../user/usecases/loadUserProfile.usecase";
import { setSession } from "../store/authSlice";
import { initSession } from "../usecases/manage-session/initSession.usecase";

export function useAuthInit() {
  const dispatch = useAppDispatch();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const authLoading = useSelector((state: AppState) => state.auth.isLoading);
  const profileLoading = useSelector((state: AppState) => state.user.loading);
  const isAuthenticated = useSelector(
    (state: AppState) => state.auth.isAuthenticated,
  );

  useEffect(() => {
    dispatch(initSession());

    const removeDeepLinkListener = setupAuthDeepLinking();

    const { unsubscribe } = dispatch((_, _getState, { authGateway }) => {
      return authGateway.onAuthStateChange((session) => {
        dispatch(setSession(session));
      });
    });

    return () => {
      removeDeepLinkListener();
      unsubscribe();
    };
  }, [dispatch]);

  useEffect(() => {
    logger.debug("Auth status changed", { isAuthenticated });
    if (isAuthenticated) {
      logger.info("User authenticated, loading profile");
      dispatch(loadUserProfile());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (isInitialLoad && !authLoading && !profileLoading) {
      logger.info("Initial auth load complete");
      setIsInitialLoad(false);
    }
  }, [authLoading, profileLoading, isInitialLoad]);

  return { isLoading: isInitialLoad };
}
