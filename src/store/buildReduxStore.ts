import {
  type Action,
  configureStore,
  type Store,
  type ThunkDispatch,
} from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import type { AuthGateway } from "../features/auth/ports/AuthGateway";
import authReducer from "../features/auth/store/authSlice";
import type { GroupGateway } from "../features/group/ports/GroupGateway";
import { groupReducer } from "../features/group/store/group.slice";
import { notificationListeners } from "../features/notification/store/notification.listeners";
import { notificationReducer } from "../features/notification/store/notification.slice";
import type { OnboardingGateway } from "../features/onboarding/ports/OnboardingGateway";
import { onboardingReducer } from "../features/onboarding/store/onboarding.slice";
import type { UserGateway } from "../features/user/ports/UserGateway";
import { userReducer } from "../features/user/store/user.slice";
import type { AppState } from "./appState";

export interface Dependencies {
  authGateway: AuthGateway;
  userGateway: UserGateway;
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
      auth: authReducer,
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
            authGateway: dependencies.authGateway,
            userGateway: dependencies.userGateway,
            onboardingGateway: dependencies.onboardingGateway,
            groupGateway: dependencies.groupGateway,
          },
        },
      }).prepend(notificationListeners.middleware),
    // @ts-expect-error - Redux DevTools Expo plugin type mismatch
    enhancers: (getDefaultEnhancers) => {
      if (isTestEnvironment) {
        return getDefaultEnhancers();
      }
      return getDefaultEnhancers().concat(devToolsEnhancer());
    },
  });
};

export type ReduxStore = Store<AppState> & {
  dispatch: ThunkDispatch<AppState, Dependencies, Action>;
};

export const useAppDispatch = () =>
  useDispatch<ThunkDispatch<AppState, Dependencies, Action>>();
