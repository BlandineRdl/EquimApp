import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import { loadUserProfile } from "./loadUserProfile.usecase";

describe("Feature: Charger mon profil utilisateur", () => {
  let store: ReduxStore;
  let userGateway: InMemoryUserGateway;
  let authGateway: InMemoryAuthGateway;
  const testEmail = "test@example.com";
  let userId: string;

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
    authGateway = new InMemoryAuthGateway();
    store = initReduxStore({ userGateway, authGateway });

    const session = await authGateway.verifyOtp(testEmail, "123456");
    userId = session.user.id;
    await store.dispatch(initSession());
  });

  describe("Success scenarios", () => {
    it("Charge un profil existant sans dépenses", async () => {
      await userGateway.createProfile({
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        currency: "EUR",
        shareRevenue: true,
      });

      await store.dispatch(loadUserProfile());

      const state = store.getState();
      expect(state.user.profile).toBeDefined();
      expect(state.user.profile?.id).toBe(userId);
      expect(state.user.profile?.pseudo).toBe("TestUser");
      expect(state.user.profile?.monthlyIncome).toBe(2000);
      expect(state.user.profile?.capacity).toBe(2000);
      expect(state.user.profile?.personalExpenses).toEqual([]);
    });

    it("Charge un profil avec dépenses personnelles", async () => {
      await userGateway.createProfile({
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        currency: "EUR",
        shareRevenue: true,
      });

      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      await userGateway.addPersonalExpense(userId, {
        label: "Transport",
        amount: 100,
      });

      await store.dispatch(loadUserProfile());

      const state = store.getState();
      expect(state.user.profile).toBeDefined();
      expect(state.user.profile?.personalExpenses).toHaveLength(2);
      expect(state.user.profile?.capacity).toBe(1100);
    });

    it("Charge les dépenses personnelles associées", async () => {
      await userGateway.createProfile({
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        currency: "EUR",
        shareRevenue: true,
      });

      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      await store.dispatch(loadUserProfile());

      const state = store.getState();
      const expenses = state.user.profile?.personalExpenses || [];
      expect(expenses).toHaveLength(1);
      expect(expenses[0].label).toBe("Loyer");
      expect(expenses[0].amount).toBe(800);
      expect(expenses[0].userId).toBe(userId);
      expect(expenses[0].id).toBeDefined();
    });

    it("Retourne une liste vide si aucune dépense", async () => {
      await userGateway.createProfile({
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        currency: "EUR",
        shareRevenue: true,
      });

      await store.dispatch(loadUserProfile());

      const state = store.getState();
      expect(state.user.profile?.personalExpenses).toEqual([]);
    });
  });

  describe("Scenario Outline: Capacité calculée correctement", () => {
    describe.each([
      { revenu: 2000, depenses: [], capacite: 2000 },
      { revenu: 2000, depenses: [800], capacite: 1200 },
      { revenu: 2000, depenses: [800, 100, 50], capacite: 1050 },
      { revenu: 1500, depenses: [800, 800], capacite: -100 },
      { revenu: 0, depenses: [100], capacite: -100 },
    ])("Calcul de capacité", ({ revenu, depenses, capacite }) => {
      it(`Revenu ${revenu}€ - Dépenses ${depenses.join("+")}€ = Capacité ${capacite}€`, async () => {
        await userGateway.createProfile({
          id: userId,
          pseudo: "TestUser",
          monthlyIncome: revenu,
          currency: "EUR",
          shareRevenue: true,
        });

        for (const [index, amount] of depenses.entries()) {
          await userGateway.addPersonalExpense(userId, {
            label: `Dépense ${index + 1}`,
            amount,
          });
        }

        await store.dispatch(loadUserProfile());

        const state = store.getState();
        expect(state.user.profile?.capacity).toBe(capacite);
      });
    });
  });

  describe("Error scenarios", () => {
    it("Retourne null si profil inexistant", async () => {
      await store.dispatch(loadUserProfile());

      const state = store.getState();
      expect(state.user.profile).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("Gère un profil avec revenu à 0", async () => {
      await userGateway.createProfile({
        id: userId,
        pseudo: "NoIncome",
        monthlyIncome: 0,
        currency: "EUR",
        shareRevenue: false,
      });

      await store.dispatch(loadUserProfile());

      const state = store.getState();
      expect(state.user.profile?.monthlyIncome).toBe(0);
      expect(state.user.profile?.capacity).toBe(0);
    });

    it("Gère une capacité négative", async () => {
      await userGateway.createProfile({
        id: userId,
        pseudo: "Deficit",
        monthlyIncome: 1000,
        currency: "EUR",
        shareRevenue: true,
      });

      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 1500,
      });

      await store.dispatch(loadUserProfile());

      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(-500);
    });

    it("Gère de très nombreuses dépenses", async () => {
      await userGateway.createProfile({
        id: userId,
        pseudo: "ManyExpenses",
        monthlyIncome: 3000,
        currency: "EUR",
        shareRevenue: true,
      });

      for (let i = 0; i < 50; i++) {
        await userGateway.addPersonalExpense(userId, {
          label: `Dépense ${i + 1}`,
          amount: 10,
        });
      }

      await store.dispatch(loadUserProfile());

      const state = store.getState();
      const expenses = state.user.profile?.personalExpenses || [];
      expect(expenses).toHaveLength(50);
      expect(state.user.profile?.capacity).toBe(2500);
    });
  });
});
