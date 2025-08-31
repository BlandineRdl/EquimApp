import {
  type Action,
  configureStore,
  type Store,
  type ThunkDispatch,
} from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { groupReducer } from "../features/group/store/group.slice";
import type { OnboardingGateway } from "../features/onboarding/ports/onboarding.gateway";
import { onboardingReducer } from "../features/onboarding/store/onboarding.slice";
import { userReducer } from "../features/user/store/user.slice";
import type { AppState } from "./appState";

export interface Dependencies {
  onboardingGateway: OnboardingGateway;
}

export const initReduxStore = (dependencies: Partial<Dependencies>) => {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
      user: userReducer,
      group: groupReducer,
    },
    devTools: true,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            onboardingGateway: dependencies.onboardingGateway,
          },
        },
      }),
  });
};

export type ReduxStore = Store<AppState> & {
  dispatch: ThunkDispatch<AppState, Dependencies, Action>;
};

export const useAppDispatch = () =>
  useDispatch<ThunkDispatch<AppState, Dependencies, Action>>();
