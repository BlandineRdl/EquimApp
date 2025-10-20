import { Redirect, Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import type { AppState } from "../../src/store/appState";

export default function AppLayout() {
  const router = useRouter();
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

  // Navigation logic
  useEffect(() => {
    if (!hydrated || profileLoading) return;

    const currentPath = segments.slice(1).join("/") || "index";

    if (
      profile &&
      (currentPath === "index" || currentPath.startsWith("onboarding"))
    ) {
      // Has profile but on onboarding → go to home
      router.replace("/home");
    } else if (
      !profile &&
      currentPath !== "index" &&
      !currentPath.startsWith("onboarding")
    ) {
      // No profile but not on onboarding → go to onboarding
      router.replace("/");
    }
  }, [hydrated, profileLoading, profile, segments, router]);

  // Show loading while checking auth
  if (!hydrated || profileLoading) {
    return null; // Keep splash visible
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  // User is authenticated → render protected routes
  return <Stack screenOptions={{ headerShown: false }} />;
}
