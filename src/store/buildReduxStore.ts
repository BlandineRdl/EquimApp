import {
  type Action,
  configureStore,
  type Store,
  type ThunkDispatch,
} from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import type { GroupGateway } from "../features/group/ports/group.gateway";
import { groupReducer } from "../features/group/store/group.slice";
import { notificationListeners } from "../features/notification/store/notification.listeners";
import { notificationReducer } from "../features/notification/store/notification.slice";
import type { OnboardingGateway } from "../features/onboarding/ports/onboarding.gateway";
import { onboardingReducer } from "../features/onboarding/store/onboarding.slice";
import { userReducer } from "../features/user/store/user.slice";
import type { AppState } from "./appState";

export interface Dependencies {
  onboardingGateway: OnboardingGateway;
  groupGateway: GroupGateway;
}

// Configuration conditionnelle pour éviter l'erreur dans les tests
const isTestEnvironment = process.env.NODE_ENV === "test";

// Import conditionnel pour éviter l'erreur dans les tests
type DevToolsEnhancer = () => (
  next: (store: unknown) => unknown,
) => (store: unknown) => unknown;
let devToolsEnhancer: DevToolsEnhancer = () => (next) => next;

if (!isTestEnvironment) {
  try {
    devToolsEnhancer = require("redux-devtools-expo-dev-plugin").default;
  } catch (error) {
    console.warn("Redux DevTools Expo plugin not available:", error);
    devToolsEnhancer = () => (next) => next;
  }
}

export const initReduxStore = (dependencies: Partial<Dependencies> = {}) => {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
      user: userReducer,
      groups: groupReducer,
      notifications: notificationReducer,
    },
    devTools: !isTestEnvironment,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            onboardingGateway: dependencies.onboardingGateway,
            groupGateway: dependencies.groupGateway,
          },
        },
      }).prepend(notificationListeners.middleware),
    enhancers: (getDefaultEnhancers) =>
      isTestEnvironment
        ? getDefaultEnhancers()
        : getDefaultEnhancers().concat(devToolsEnhancer()),
  });
};

export type ReduxStore = Store<AppState> & {
  dispatch: ThunkDispatch<AppState, Dependencies, Action>;
};

export const useAppDispatch = () =>
  useDispatch<ThunkDispatch<AppState, Dependencies, Action>>();
