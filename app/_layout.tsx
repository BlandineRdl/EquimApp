import { Stack } from "expo-router";
import React from "react";
import { Provider } from "react-redux";
import { initReduxStore } from "../src/store/buildReduxStore";

//const userGateway = new InMemoryUserGateway();
const store = initReduxStore();

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="income" />
        <Stack.Screen name="create-group" />
        <Stack.Screen name="expenses" />
        <Stack.Screen name="summary" />
      </Stack>
    </Provider>
  );
}
