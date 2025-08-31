import { Stack } from "expo-router";
import React from "react";
import { Provider } from "react-redux";
import { InMemoryOnboardingGateway } from "../src/features/onboarding/infra/inMemoryOnBoarding.gateway";
import { initReduxStore } from "../src/store/buildReduxStore";

const onboardingGateway = new InMemoryOnboardingGateway();
const store = initReduxStore({ onboardingGateway });

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/income" />
        <Stack.Screen name="onboarding/create-group" />
        <Stack.Screen name="onboarding/expenses" />
        <Stack.Screen name="onboarding/summary" />
      </Stack>
    </Provider>
  );
}
