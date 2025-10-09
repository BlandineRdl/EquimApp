import { Redirect, Stack } from "expo-router";
import { useSelector } from "react-redux";
import type { AppState } from "../../src/store/appState";

export default function AuthLayout() {
  const { hydrated, isAuthenticated } = useSelector(
    (state: AppState) => state.auth,
  );

  // Wait for auth to be hydrated
  if (!hydrated) {
    return null; // Splash screen still visible
  }

  // If authenticated, redirect to app group (which will handle profile routing)
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
