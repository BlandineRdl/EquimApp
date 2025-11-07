import { PortalHost, PortalProvider } from "@gorhom/portal";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { ToastPortal } from "../src/components/ToastPortal";
import { useAuthInit } from "../src/features/auth/hooks/useAuthInit";
import { SupabaseAuthGateway } from "../src/features/auth/infra/SupabaseAuthGateway";
import { SupabaseGroupGateway } from "../src/features/group/infra/SupabaseGroupGateway";
import { SupabaseOnboardingGateway } from "../src/features/onboarding/infra/SupabaseOnboardingGateway";
import { SupabaseUserGateway } from "../src/features/user/infra/SupabaseUserGateway";
import { TamaguiProvider } from "../src/lib/tamagui/theme-provider";
import { initReduxStore } from "../src/store/buildReduxStore";

SplashScreen.preventAutoHideAsync();

const authGateway = new SupabaseAuthGateway();
const userGateway = new SupabaseUserGateway();
const groupGateway = new SupabaseGroupGateway();
const onboardingGateway = new SupabaseOnboardingGateway();
const store = initReduxStore({
  authGateway,
  userGateway,
  onboardingGateway,
  groupGateway,
});

function InitializeApp() {
  // Initialize auth on app startup
  useAuthInit();

  return (
    <>
      <Slot />
      <PortalHost name="toast" />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <TamaguiProvider>
        <SafeAreaProvider>
          <Provider store={store}>
            <PortalProvider>
              <InitializeApp />
              <ToastPortal />
            </PortalProvider>
          </Provider>
        </SafeAreaProvider>
      </TamaguiProvider>
    </ErrorBoundary>
  );
}
