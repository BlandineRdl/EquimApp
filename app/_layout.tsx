import { Stack } from "expo-router";
import React from "react";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";
import { InMemoryGroupGateway } from "../src/features/group/infra/inMemoryGroup.gateway";
import { InMemoryOnboardingGateway } from "../src/features/onboarding/infra/inMemoryOnBoarding.gateway";
import { initReduxStore } from "../src/store/buildReduxStore";

const groupGateway = new InMemoryGroupGateway();
const onboardingGateway = new InMemoryOnboardingGateway(groupGateway);
const store = initReduxStore({ onboardingGateway, groupGateway });

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/income" />
        <Stack.Screen name="onboarding/create-group" />
        <Stack.Screen name="onboarding/expenses" />
        <Stack.Screen name="onboarding/summary" />
        <Stack.Screen name="group/[groupId]" />
      </Stack>

      <Toast />
    </Provider>
  );
}
