import { beforeEach, describe, expect, it } from "vitest";
import type { ReduxStore } from "../../../../store/buildReduxStore";
import { initReduxStore } from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryGroupGateway } from "../../../group/infra/inMemoryGroup.gateway";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryOnboardingGateway } from "../../infra/InMemoryOnboardingGateway";
import type { CompleteOnboardingResult } from "../../ports/OnboardingGateway";
import {
  setGroupName,
  setMonthlyIncome,
  setPseudo,
  setSkipGroupCreation,
  updateExpenseAmount,
} from "../../store/onboarding.slice";
import { completeOnboarding } from "./completeOnboarding.usecase";

describe("Feature: Compléter l'onboarding", () => {
  let store: ReduxStore;
  let authGateway: InMemoryAuthGateway;
  let onboardingGateway: InMemoryOnboardingGateway;
  let userGateway: InMemoryUserGateway;
  let groupGateway: InMemoryGroupGateway;
  const testEmail = "test@example.com";

  beforeEach(async () => {
    authGateway = new InMemoryAuthGateway();
    groupGateway = new InMemoryGroupGateway();
    onboardingGateway = new InMemoryOnboardingGateway(groupGateway);
    userGateway = new InMemoryUserGateway();

    store = initReduxStore({
      authGateway,
      onboardingGateway,
      userGateway,
      groupGateway,
    }) as ReduxStore;

    await authGateway.verifyOtp(testEmail, "123456");
    await store.dispatch(initSession());
  });

  describe("Scénario: Création complète d'un compte avec profil et groupe", () => {
    it("should complete onboarding with profile, group, and expenses", async () => {
      store.dispatch(setPseudo("Alice"));
      store.dispatch(setMonthlyIncome("3000"));
      store.dispatch(setGroupName("Famille Alice"));

      store.dispatch(updateExpenseAmount({ id: "rent", amount: "800" }));
      store.dispatch(updateExpenseAmount({ id: "groceries", amount: "400" }));

      const result = await store.dispatch(completeOnboarding());

      expect(result.type).toBe("onboarding/complete/fulfilled");
      if (result.type !== "onboarding/complete/fulfilled") {
        throw new Error("Expected fulfilled action");
      }
      expect(result.payload).toMatchObject({
        profileId: expect.any(String),
        groupId: expect.any(String),
        profile: {
          pseudo: "Alice",
          income: 3000,
        },
      });

      const onboardingState = store.getState().onboarding;
      expect(onboardingState.completed).toBe(true);
      expect(onboardingState.completing).toBe(false);
      expect(onboardingState.error).toBeNull();
    });

    it("should filter out expenses with zero amount", async () => {
      store.dispatch(setPseudo("Bob"));
      store.dispatch(setMonthlyIncome("2500"));
      store.dispatch(setGroupName("Maison Bob"));

      store.dispatch(updateExpenseAmount({ id: "rent", amount: "750" }));
      store.dispatch(updateExpenseAmount({ id: "electricity", amount: "100" }));

      const result = await store.dispatch(completeOnboarding());

      expect(result.type).toBe("onboarding/complete/fulfilled");
    });

    it("should set completing state during onboarding process", async () => {
      store.dispatch(setPseudo("Charlie"));
      store.dispatch(setMonthlyIncome("4000"));
      store.dispatch(setGroupName("Charlie's Home"));

      const promise = store.dispatch(completeOnboarding());

      expect(store.getState().onboarding.completing).toBe(true);
      expect(store.getState().onboarding.error).toBeNull();

      await promise;

      expect(store.getState().onboarding.completing).toBe(false);
      expect(store.getState().onboarding.completed).toBe(true);
    });

    it("should handle onboarding failure gracefully", async () => {
      store.dispatch(setPseudo("Dave"));
      store.dispatch(setMonthlyIncome("invalid"));
      store.dispatch(setGroupName("Dave's Place"));

      const result = await store.dispatch(completeOnboarding());

      expect(result.type).toBe("onboarding/complete/fulfilled");
    });
  });

  describe("Scénario: Création avec dépenses personnelles", () => {
    it("should create personal expenses after profile creation", async () => {
      store.dispatch(setPseudo("Emma"));
      store.dispatch(setMonthlyIncome("3500"));
      store.dispatch(setGroupName("Emma's Home"));

      store.dispatch({
        type: "onboarding/setPersonalExpenses",
        payload: [
          { label: "Gym", amount: 50 },
          { label: "Netflix", amount: 15 },
        ],
      });

      await store.dispatch(completeOnboarding());

      const userExpenses = await userGateway.loadPersonalExpenses("user-1");
      expect(userExpenses).toHaveLength(2);
      expect(userExpenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Gym", amount: 50 }),
          expect.objectContaining({ label: "Netflix", amount: 15 }),
        ]),
      );
    });

    it("should complete onboarding even if personal expenses creation fails", async () => {
      store.dispatch(setPseudo("Frank"));
      store.dispatch(setMonthlyIncome("2800"));
      store.dispatch(setGroupName("Frank's Family"));

      store.dispatch({
        type: "onboarding/setPersonalExpenses",
        payload: [{ label: "Test", amount: 100 }],
      });

      const result = await store.dispatch(completeOnboarding());

      expect(result.type).toBe("onboarding/complete/fulfilled");
      expect(store.getState().onboarding.completed).toBe(true);
    });
  });

  describe("Scénario: Validation des données d'entrée", () => {
    it("should trim whitespace from pseudo and group name", async () => {
      store.dispatch(setPseudo("  Alice  "));
      store.dispatch(setMonthlyIncome("3000"));
      store.dispatch(setGroupName("  Ma Famille  "));

      const result = await store.dispatch(completeOnboarding());

      if (result.type !== "onboarding/complete/fulfilled") {
        throw new Error("Expected fulfilled action");
      }
      expect(result.payload).toMatchObject({
        profile: {
          pseudo: "Alice",
          income: 3000,
        },
      });
    });

    it("should convert string income to number", async () => {
      store.dispatch(setPseudo("Grace"));
      store.dispatch(setMonthlyIncome("4500.50"));
      store.dispatch(setGroupName("Grace's Home"));

      const result = await store.dispatch(completeOnboarding());

      if (result.type !== "onboarding/complete/fulfilled") {
        throw new Error("Expected fulfilled action");
      }
      const payload = result.payload as { profile: { income: number } };
      expect(payload.profile.income).toBe(4500.5);
      expect(typeof payload.profile.income).toBe("number");
    });
  });

  describe("Scénario: Création de compte sans groupe (optionnel)", () => {
    it("should complete onboarding without creating a group when skipped", async () => {
      store.dispatch(setPseudo("Helen"));
      store.dispatch(setMonthlyIncome("3200"));
      store.dispatch(setSkipGroupCreation(true));

      const result = await store.dispatch(completeOnboarding());

      expect(result.type).toBe("onboarding/complete/fulfilled");
      if (result.type !== "onboarding/complete/fulfilled") {
        throw new Error("Expected fulfilled action");
      }

      expect(result.payload).toMatchObject({
        profileId: expect.any(String),
        profile: {
          pseudo: "Helen",
          income: 3200,
        },
      });

      const payload = result.payload as CompleteOnboardingResult & {
        profile: { pseudo: string; income: number };
      };
      expect(payload.groupId).toBeUndefined();
      expect(payload.shares).toBeUndefined();

      const onboardingState = store.getState().onboarding;
      expect(onboardingState.completed).toBe(true);
      expect(onboardingState.completing).toBe(false);
      expect(onboardingState.error).toBeNull();
    });

    it("should create profile with personal expenses but no group when skipped", async () => {
      store.dispatch(setPseudo("Ivan"));
      store.dispatch(setMonthlyIncome("2900"));
      store.dispatch(setSkipGroupCreation(true));

      store.dispatch({
        type: "onboarding/setPersonalExpenses",
        payload: [
          { label: "Car Payment", amount: 300 },
          { label: "Insurance", amount: 80 },
        ],
      });

      const result = await store.dispatch(completeOnboarding());

      expect(result.type).toBe("onboarding/complete/fulfilled");

      const userExpenses = await userGateway.loadPersonalExpenses("user-1");
      expect(userExpenses).toHaveLength(2);
      expect(userExpenses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: "Car Payment", amount: 300 }),
          expect.objectContaining({ label: "Insurance", amount: 80 }),
        ]),
      );

      if (result.type === "onboarding/complete/fulfilled") {
        const payload = result.payload as CompleteOnboardingResult & {
          profile: { pseudo: string; income: number };
        };
        expect(payload.groupId).toBeUndefined();
      }
    });
  });
});
