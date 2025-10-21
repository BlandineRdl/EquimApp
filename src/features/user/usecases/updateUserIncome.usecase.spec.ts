/**
 * Feature: Mettre à jour mon revenu mensuel
 * En tant qu'utilisateur authentifié,
 * Je veux modifier mon revenu mensuel,
 * Afin de refléter mes changements financiers.
 */

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

    // Setup authenticated user session using verifyOtp
    const session = await authGateway.verifyOtp(testEmail, "123456");
    userId = session.user.id;
    await store.dispatch(initSession());

    // Setup initial profile data
    await userGateway.createProfile({
      id: userId,
      pseudo: "TestUser",
      monthlyIncome: 2000,
      currency: "EUR",
      shareRevenue: true,
    });

    // Load the profile into Redux state
    await store.dispatch(loadUserProfile());
  });

  describe("Success scenarios", () => {
    it("Met à jour le revenu mensuel", async () => {
      // Act
      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 2500,
        }),
      );

      // Assert
      const state = store.getState();
      expect(state.user.profile?.monthlyIncome).toBe(2500);
    });

    it("Recalcule la capacité après mise à jour du revenu", async () => {
      // Arrange - Add expense via gateway then reload
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });
      await store.dispatch(loadUserProfile());

      // Act - Update income
      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 3000,
        }),
      );

      // Assert - Capacity should be 3000 - 800 = 2200
      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(2200);
    });

    it("Peut augmenter le revenu", async () => {
      // Act
      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 2500,
        }),
      );

      // Assert
      const state = store.getState();
      expect(state.user.profile?.monthlyIncome).toBe(2500);
      expect(state.user.profile?.capacity).toBe(2500);
    });

    it("Peut diminuer le revenu", async () => {
      // Act
      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 1500,
        }),
      );

      // Assert
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
          // Arrange
          if (depense > 0) {
            await userGateway.addPersonalExpense(userId, {
              label: "Dépense test",
              amount: depense,
            });
            // Reload profile to get the expense in state
            await store.dispatch(loadUserProfile());
          }

          // Act
          await store.dispatch(
            updateUserIncome({
              userId,
              newIncome: nouveauRevenu,
            }),
          );

          // Assert
          const state = store.getState();
          expect(state.user.profile?.capacity).toBe(capacite);
        });
      },
    );
  });

  describe("Edge cases", () => {
    it("Rejette un revenu à 0 (en dessous du minimum)", async () => {
      // Act
      const result = await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 0,
        }),
      );

      // Assert - Income update should be rejected
      expect(result.type).toContain("rejected");

      // State should remain unchanged (optimistic update rolled back)
      const state = store.getState();
      expect(state.user.profile?.monthlyIncome).toBe(2000); // Original value
    });

    it("Capacité négative si dépenses > revenu", async () => {
      // Arrange
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 1500,
      });
      await store.dispatch(loadUserProfile());

      // Act
      await store.dispatch(
        updateUserIncome({
          userId,
          newIncome: 1000,
        }),
      );

      // Assert
      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(-500);
    });
  });

  describe("Error scenarios", () => {
    it("Erreur si utilisateur inexistant", async () => {
      // Act & Assert
      const result = await store.dispatch(
        updateUserIncome({
          userId: "non-existent-user",
          newIncome: 2500,
        }),
      );

      // Assert - Check that the action was rejected
      expect(result.type).toContain("rejected");
    });
  });
});
