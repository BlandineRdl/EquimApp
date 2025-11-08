import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import { addPersonalExpense } from "./addPersonalExpense.usecase";
import { loadUserProfile } from "./loadUserProfile.usecase";

describe("Feature: Gérer mes dépenses personnelles", () => {
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

    await userGateway.createProfile({
      id: userId,
      pseudo: "TestUser",
      monthlyIncome: 2000,
      currency: "EUR",
      shareRevenue: true,
    });

    await store.dispatch(loadUserProfile());
  });

  describe("Success scenarios", () => {
    it("Ajouter un loyer diminue la capacité", async () => {
      await store.dispatch(
        addPersonalExpense({
          label: "Loyer",
          amount: 800,
        }),
      );

      const state = store.getState();
      expect(state.user.profile).toBeDefined();
      expect(state.user.profile?.personalExpenses).toHaveLength(1);
      expect(state.user.profile?.personalExpenses?.[0].label).toBe("Loyer");
      expect(state.user.profile?.personalExpenses?.[0].amount).toBe(800);
      expect(state.user.profile?.capacity).toBe(1200);
    });

    it("Autoriser une capacité négative si dépenses > revenu", async () => {
      await store.dispatch(
        addPersonalExpense({
          label: "Loyer",
          amount: 2500,
        }),
      );

      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(-500);
    });

    it("Ajouter plusieurs dépenses accumule les montants", async () => {
      await store.dispatch(
        addPersonalExpense({
          label: "Loyer",
          amount: 800,
        }),
      );

      await store.dispatch(
        addPersonalExpense({
          label: "Transport",
          amount: 100,
        }),
      );

      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(1100);

      expect(state.user.profile?.personalExpenses).toHaveLength(2);
    });

    it("Accepter des montants décimaux", async () => {
      await store.dispatch(
        addPersonalExpense({
          label: "Café",
          amount: 3.5,
        }),
      );

      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(1996.5);
    });
  });

  describe("Business rules", () => {
    describe.each([
      { revenu: 2000, label: "Loyer", montant: 800, capacite: 1200 },
      { revenu: 2000, label: "Loyer", montant: 2500, capacite: -500 },
      { revenu: 3000, label: "Transport", montant: 150, capacite: 2850 },
      { revenu: 1500, label: "Courses", montant: 1500, capacite: 0 },
    ])("Calcul de capacité", ({ revenu, label, montant, capacite }) => {
      it(`Revenu ${revenu}€ - ${label} ${montant}€ → Capacité ${capacite}€`, async () => {
        const testUserEmail = `test-${revenu}@example.com`;
        const testSession = await authGateway.verifyOtp(
          testUserEmail,
          "123456",
        );
        const testUserId = testSession.user.id;
        await store.dispatch(initSession());

        await userGateway.createProfile({
          id: testUserId,
          pseudo: "TestUser",
          monthlyIncome: revenu,
          currency: "EUR",
          shareRevenue: true,
        });

        await store.dispatch(loadUserProfile());

        await store.dispatch(
          addPersonalExpense({
            label,
            amount: montant,
          }),
        );

        const state = store.getState();
        expect(state.user.profile?.capacity).toBe(capacite);
      });
    });
  });
});
