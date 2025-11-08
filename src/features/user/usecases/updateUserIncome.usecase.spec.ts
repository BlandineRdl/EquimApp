import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import { loadUserProfile } from "./loadUserProfile.usecase";
import { updateUserIncome } from "./updateUserIncome.usecase";

describe("Feature: Mettre à jour mon revenu mensuel", () => {
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
    it("Met à jour le revenu mensuel", async () => {
      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 2500,
        }),
      );

      const state = store.getState();
      expect(state.user.profile?.monthlyIncome).toBe(2500);
    });

    it("Recalcule la capacité après mise à jour du revenu", async () => {
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });
      await store.dispatch(loadUserProfile());

      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 3000,
        }),
      );

      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(2200);
    });

    it("Peut augmenter le revenu", async () => {
      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 2500,
        }),
      );

      const state = store.getState();
      expect(state.user.profile?.monthlyIncome).toBe(2500);
      expect(state.user.profile?.capacity).toBe(2500);
    });

    it("Peut diminuer le revenu", async () => {
      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 1500,
        }),
      );

      const state = store.getState();
      expect(state.user.profile?.monthlyIncome).toBe(1500);
      expect(state.user.profile?.capacity).toBe(1500);
    });
  });

  describe("Scenario Outline: Calcul de capacité après changement de revenu", () => {
    describe.each([
      { revenu: 2000, nouveauRevenu: 2500, depense: 800, capacite: 1700 },
      { revenu: 2000, nouveauRevenu: 1500, depense: 800, capacite: 700 },
      { revenu: 2000, nouveauRevenu: 3000, depense: 0, capacite: 3000 },
      { revenu: 2000, nouveauRevenu: 1000, depense: 1500, capacite: -500 },
    ])(
      "Capacité après changement de revenu",
      ({ revenu, nouveauRevenu, depense, capacite }) => {
        it(`Revenu ${revenu}€ → ${nouveauRevenu}€ avec dépense ${depense}€ = Capacité ${capacite}€`, async () => {
          if (depense > 0) {
            await userGateway.addPersonalExpense(userId, {
              label: "Dépense test",
              amount: depense,
            });
            await store.dispatch(loadUserProfile());
          }

          await store.dispatch(
            updateUserIncome({
              userId,
              newIncome: nouveauRevenu,
            }),
          );

          const state = store.getState();
          expect(state.user.profile?.capacity).toBe(capacite);
        });
      },
    );
  });

  describe("Edge cases", () => {
    it("Rejette un revenu à 0 (en dessous du minimum)", async () => {
      const result = await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 0,
        }),
      );

      expect(result.type).toContain("rejected");

      const state = store.getState();
      expect(state.user.profile?.monthlyIncome).toBe(2000);
    });

    it("Capacité négative si dépenses > revenu", async () => {
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 1500,
      });
      await store.dispatch(loadUserProfile());

      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 1000,
        }),
      );

      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(-500);
    });
  });

  describe("Error scenarios", () => {
    it("Erreur si utilisateur inexistant", async () => {
      const result = await store.dispatch(
        updateUserIncome({
          userId: "non-existent-user",
          newIncome: 2500,
        }),
      );

      expect(result.type).toContain("rejected");
    });
  });
});
