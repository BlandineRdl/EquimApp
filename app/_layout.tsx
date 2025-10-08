import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect } from "react";
import Toast from "react-native-toast-message";
import { Provider, useSelector } from "react-redux";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { useAuthInit } from "../src/features/auth/hooks/useAuthInit";
import { SupabaseAuthGateway } from "../src/features/auth/infra/SupabaseAuthGateway";
import { SupabaseGroupGateway } from "../src/features/group/infra/SupabaseGroupGateway";
import { SupabaseOnboardingGateway } from "../src/features/onboarding/infra/SupabaseOnboardingGateway";
import { SupabaseUserGateway } from "../src/features/user/infra/SupabaseUserGateway";
import { logger } from "../src/lib/logger";
import type { AppState } from "../src/store/appState";
import { initReduxStore } from "../src/store/buildReduxStore";

const authGateway = new SupabaseAuthGateway();
const userGateway = new SupabaseUserGateway();
const groupGateway = new SupabaseGroupGateway();
const onboardingGateway = new SupabaseOnboardingGateway();
const store = initReduxStore({ authGateway, userGateway, onboardingGateway, groupGateway });

function AppContent() {
  const router = useRouter();
  const segments = useSegments();

  // Initialize auth (restore session, listen for changes, handle deep links, load profile)
  const { isLoading } = useAuthInit();

  const { isAuthenticated } = useSelector((state: AppState) => state.auth);
  const { profile, loading: profileLoading } = useSelector((state: AppState) => state.user);

  useEffect(() => {
    logger.debug("Navigation check", {
      isLoading,
      profileLoading,
      isAuthenticated,
      hasProfile: !!profile,
      segment: segments[0]
    });

    if (isLoading || profileLoading) return; // Wait for auth and profile to load

    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "index" || segments[0] === "onboarding";

    // Wait a tick for router to be ready
    const timeout = setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        logger.debug("Redirecting to sign-in (not authenticated)");
        router.replace("/auth/sign-in");
      } else if (isAuthenticated && inAuthGroup) {
        // User is authenticated, redirect based on profile status
        if (profile) {
          logger.debug("Redirecting to /home (has profile)");
          router.replace("/home");
        } else {
          logger.debug("Redirecting to / (needs onboarding)");
          router.replace("/");
        }
      } else if (isAuthenticated && profile && (!segments[0] || inOnboarding)) {
        // User has profile but is on root/undefined or onboarding
        logger.debug("Redirecting to /home (has profile, needs redirect)");
        router.replace("/home");
      } else if (isAuthenticated && !profile && !inOnboarding) {
        // User is authenticated but hasn't completed onboarding
        logger.debug("Redirecting to / (authenticated but no profile)");
        router.replace("/");
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, profile, segments, isLoading, profileLoading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/income" />
        <Stack.Screen name="onboarding/create-group" />
        <Stack.Screen name="onboarding/expenses" />
        <Stack.Screen name="onboarding/summary" />
        <Stack.Screen name="group/[groupId]" />
        <Stack.Screen name="home" />
      </Stack>

      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </ErrorBoundary>
  );
}
