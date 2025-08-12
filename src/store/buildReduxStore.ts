import {
  type Action,
  configureStore,
  type Store,
  type ThunkDispatch,
} from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
//import type { UserGateway } from "../features/onboarding/domain/user.gateway";
import { onboardingReducer } from "../features/onboarding/store/onboarding.slice";
import type { AppState } from "./appState";

//interface Dependencies {
//userGateway: UserGateway;
//}

export const initReduxStore = () => {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
    },
    devTools: true,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {},
        },
      }),
  });
};

export type ReduxStore = Store<AppState> & {
  dispatch: ThunkDispatch<AppState, {}, Action>;
};

export const useAppDispatch = () =>
  useDispatch<ThunkDispatch<AppState, {}, Action>>();
