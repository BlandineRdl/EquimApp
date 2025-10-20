import { Redirect, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { logger } from "../../src/lib/logger";
import type { AppState } from "../../src/store/appState";

export default function AppLayout() {
  const segments = useSegments();
  const splashHiddenRef = useRef(false);

  const { hydrated, isAuthenticated } = useSelector(
    (state: AppState) => state.auth,
  );
  const { profile, loading: profileLoading } = useSelector(
    (state: AppState) => state.user,
  );

  // Hide splash once ready
  useEffect(() => {
    if (hydrated && !profileLoading && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch((error) => {
        // Silently catch if splash screen was already hidden
        console.warn("Failed to hide splash screen:", error);
      });
    }
  }, [hydrated, profileLoading]);

  // Show loading while checking auth/profile
  // We return null to keep the splash screen visible until we're ready to navigate
  if (!hydrated || profileLoading) {
    logger.debug("[AppLayout] Loading...", { hydrated, profileLoading });
    return null; // Keep splash visible
  }

  // Redirect to sign-in if not authenticated
  // Using Redirect component (not router.replace()) because it works correctly
  // during the initial render phase and prevents navigation race conditions
  if (!isAuthenticated) {
    logger.debug("[AppLayout] Not authenticated, redirecting to sign-in");
    return <Redirect href="/sign-in" />;
  }

  // Calculate current path
  const currentPath = segments.slice(1).join("/") || "index";
  const isOnOnboarding =
    currentPath === "index" || currentPath.startsWith("onboarding");
  const isOnProtectedRoute = !isOnOnboarding;

  logger.debug("[AppLayout] Navigation state", {
    currentPath,
    hasProfile: !!profile,
    isOnOnboarding,
    isOnProtectedRoute,
  });

  // Has profile but trying to access onboarding → redirect to home
  // Using Redirect in render ensures the navigation happens immediately after hydration
  // and prevents the user from seeing onboarding screens when they already have a profile
  if (profile && isOnOnboarding) {
    logger.info(
      "[AppLayout] Has profile but on onboarding, redirecting to /home",
    );
    return <Redirect href="/home" />;
  }

  // No profile but trying to access protected routes → redirect to onboarding
  // Using Redirect ensures users without a profile can't access app screens directly
  // This prevents errors from components expecting profile data to exist
  if (!profile && isOnProtectedRoute) {
    logger.info(
      "[AppLayout] No profile but on protected route, redirecting to onboarding",
    );
    return <Redirect href="/" />;
  }

  // User is authenticated and on correct route → render protected routes
  logger.debug("[AppLayout] Rendering app routes");
  return <Stack screenOptions={{ headerShown: false }} />;
}
