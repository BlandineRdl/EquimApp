import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import type { AppState } from "../../../../store/appState";
import {
  type Dependencies,
  initReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryGroupGateway } from "../../../group/infra/inMemoryGroup.gateway";
import { InMemoryOnboardingGateway } from "../../infra/inMemoryOnBoarding.gateway";
import { completeOnboarding } from "./completeOnboarding.usecase";

export interface OnboardingDsl {
  setup(): Promise<void>;
  teardown(): Promise<void>;

  givenUserFillsOnboarding(data: {
    pseudo: string;
    monthlyIncome: string;
    groupName: string;
  }): Promise<void>;

  andUserAddsExpense(data: { id: string; amount: string }): Promise<void>;

  andUserAddsCustomExpense(data: {
    label: string;
    amount: string;
  }): Promise<void>;

  whenCompletingOnboarding(): Promise<void>;

  thenOnboardingIsCompleted(): Promise<void>;

  thenUserProfileIsCreated(expectedData: {
    pseudo: string;
    monthlyIncome: number;
  }): Promise<void>;

  thenGroupIsCreated(expectedData: {
    name: string;
    totalBudget: number;
    membersCount?: number;
  }): Promise<void>;
}

export const loadOnboardingDsl = (): OnboardingDsl => {
  const groupGateway = new InMemoryGroupGateway();
  const gateway = new InMemoryOnboardingGateway(groupGateway);
  const store = initReduxStore({ onboardingGateway: gateway, groupGateway });

  const dispatch: ThunkDispatch<AppState, Dependencies, Action> =
    store.dispatch;

  return {
    async setup(): Promise<void> {
      // Setup if needed
    },

    async teardown(): Promise<void> {
      gateway.reset();
    },

    async givenUserFillsOnboarding(data: {
      pseudo: string;
      monthlyIncome: string;
      groupName: string;
    }): Promise<void> {
      dispatch({ type: "onboarding/setPseudo", payload: data.pseudo });
      dispatch({
        type: "onboarding/setMonthlyIncome",
        payload: data.monthlyIncome,
      });
      dispatch({
        type: "onboarding/setGroupName",
        payload: data.groupName,
      });
    },

    async andUserAddsExpense(data: {
      id: string;
      amount: string;
    }): Promise<void> {
      dispatch({
        type: "onboarding/updateExpenseAmount",
        payload: { id: data.id, amount: data.amount },
      });
    },

    async andUserAddsCustomExpense(data: {
      label: string;
      amount: string;
    }): Promise<void> {
      dispatch({
        type: "onboarding/addCustomExpense",
        payload: {
          label: data.label,
          amount: data.amount,
        },
      });
    },

    async whenCompletingOnboarding(): Promise<void> {
      await dispatch(completeOnboarding());
    },

    async thenOnboardingIsCompleted(): Promise<void> {
      const state = store.getState();

      expect(state.onboarding.completing).toBe(false);
      expect(state.onboarding.completed).toBe(true);
      expect(state.onboarding.error).toBeNull();
    },

    async thenUserProfileIsCreated(expectedData: {
      pseudo: string;
      monthlyIncome: number;
    }): Promise<void> {
      const state = store.getState();

      expect(state.user.profile).toEqual({
        id: "user-1",
        pseudo: expectedData.pseudo,
        monthlyIncome: expectedData.monthlyIncome,
        shareRevenue: true,
      });
    },

    async thenGroupIsCreated(expectedData: {
      name: string;
      totalBudget: number;
      membersCount?: number;
    }): Promise<void> {
      const state = store.getState();

      const expectedGroup = {
        id: "group-1",
        name: expectedData.name,
        totalMonthlyBudget: expectedData.totalBudget,
        members: expect.any(Array),
      };

      expect(state.groups.entities).toEqual({
        "group-1": expect.objectContaining(expectedGroup),
      });

      if (expectedData.membersCount !== undefined) {
        // Vérifier le nombre de membres si spécifié
        const group = state.groups.entities["group-1"];
        expect(group.members).toHaveLength(expectedData.membersCount);
      }
    },
  };
};
