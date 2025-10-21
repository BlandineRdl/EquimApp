/**
 * Feature: Charger mes dépenses personnelles
 * En tant qu'utilisateur authentifié,
 * Je veux charger toutes mes dépenses personnelles,
 * Afin de voir le détail de mes dépenses.
 *
 * NOTE: In the current architecture, personal expenses are loaded as part of loadUserProfile.
 * This test validates that the Redux thunk works correctly.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import { loadPersonalExpenses } from "./loadPersonalExpenses.usecase";
import { loadUserProfile } from "./loadUserProfile.usecase";

describe("Feature: Charger mes dépenses personnelles", () => {
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
  });

  describe("Success scenarios", () => {
    it("Charge une liste vide quand aucune dépense", async () => {
      // Act - Load profile which includes expenses
      await store.dispatch(loadUserProfile());

      // Assert
      const state = store.getState();
      expect(state.user.profile?.personalExpenses).toEqual([]);
    });

    it("Charge une seule dépense", async () => {
      // Arrange - Add expense via gateway
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      // Act - Load profile which includes expenses
      await store.dispatch(loadUserProfile());

      // Assert
      const state = store.getState();
      const expenses = state.user.profile?.personalExpenses || [];
      expect(expenses).toHaveLength(1);
      expect(expenses[0]).toMatchObject({
        label: "Loyer",
        amount: 800,
        userId,
      });
      expect(expenses[0].id).toBeDefined();
    });

    it("Charge plusieurs dépenses dans l'ordre d'ajout", async () => {
      // Arrange
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });
      await userGateway.addPersonalExpense(userId, {
        label: "Transport",
        amount: 100,
      });
      await userGateway.addPersonalExpense(userId, {
        label: "Nourriture",
        amount: 300,
      });

      // Act
      await store.dispatch(loadUserProfile());

      // Assert
      const state = store.getState();
      const expenses = state.user.profile?.personalExpenses || [];
      expect(expenses).toHaveLength(3);
      expect(expenses[0].label).toBe("Loyer");
      expect(expenses[1].label).toBe("Transport");
      expect(expenses[2].label).toBe("Nourriture");
    });

    it("Charge toutes les propriétés des dépenses", async () => {
      // Arrange
      const expense = await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      // Act
      await store.dispatch(loadUserProfile());

      // Assert
      const state = store.getState();
      const expenses = state.user.profile?.personalExpenses || [];
      expect(expenses[0]).toEqual({
        id: expense.id,
        userId,
        label: "Loyer",
        amount: 800,
      });
    });

    it("Ne charge que les dépenses de l'utilisateur concerné", async () => {
      // Arrange - Create another user
      const otherUserId = "other-user-456";
      await userGateway.createProfile({
        id: otherUserId,
        pseudo: "OtherUser",
        monthlyIncome: 1500,
        currency: "EUR",
        shareRevenue: true,
      });

      // Add expenses for both users
      await userGateway.addPersonalExpense(userId, {
        label: "My Rent",
        amount: 800,
      });
      await userGateway.addPersonalExpense(otherUserId, {
        label: "Other Rent",
        amount: 600,
      });

      // Act - Load profile for main user
      await store.dispatch(loadUserProfile());

      // Assert - Only main user's expenses are loaded
      const state = store.getState();
      const myExpenses = state.user.profile?.personalExpenses || [];
      expect(myExpenses).toHaveLength(1);
      expect(myExpenses[0].label).toBe("My Rent");
      expect(myExpenses[0].userId).toBe(userId);
    });
  });

  describe("Scenario Outline: Charger différents nombres de dépenses", () => {
    describe.each([
      { count: 0, description: "aucune dépense" },
      { count: 1, description: "une dépense" },
      { count: 5, description: "plusieurs dépenses" },
      { count: 20, description: "beaucoup de dépenses" },
    ])("Charger $description", ({ count, description }) => {
      it(`Charge ${description} correctement`, async () => {
        // Arrange
        for (let i = 0; i < count; i++) {
          await userGateway.addPersonalExpense(userId, {
            label: `Dépense ${i + 1}`,
            amount: 100 + i * 10,
          });
        }

        // Act
        await store.dispatch(loadUserProfile());

        // Assert
        const state = store.getState();
        const expenses = state.user.profile?.personalExpenses || [];
        expect(expenses).toHaveLength(count);
        if (count > 0) {
          expect(expenses[0].label).toBe("Dépense 1");
          expect(expenses[0].amount).toBe(100);
        }
      });
    });
  });

  describe("Edge cases", () => {
    it("Retourne liste vide pour utilisateur sans dépenses", async () => {
      // Act
      await store.dispatch(loadUserProfile());

      // Assert
      const state = store.getState();
      expect(state.user.profile?.personalExpenses).toEqual([]);
    });

    it("Gère des montants variés", async () => {
      // Arrange
      await userGateway.addPersonalExpense(userId, {
        label: "Petit",
        amount: 0.01,
      });
      await userGateway.addPersonalExpense(userId, {
        label: "Gratuit",
        amount: 0,
      });
      await userGateway.addPersonalExpense(userId, {
        label: "Énorme",
        amount: 99999.99,
      });

      // Act
      await store.dispatch(loadUserProfile());

      // Assert
      const state = store.getState();
      const expenses = state.user.profile?.personalExpenses || [];
      expect(expenses).toHaveLength(3);
      expect(expenses[0].amount).toBe(0.01);
      expect(expenses[1].amount).toBe(0);
      expect(expenses[2].amount).toBe(99999.99);
    });

    it("Gère des labels avec caractères spéciaux", async () => {
      // Arrange
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer & Charges",
        amount: 800,
      });
      await userGateway.addPersonalExpense(userId, {
        label: "Transport (métro)",
        amount: 100,
      });
      await userGateway.addPersonalExpense(userId, {
        label: "Café ☕",
        amount: 5,
      });

      // Act
      await store.dispatch(loadUserProfile());

      // Assert
      const state = store.getState();
      const expenses = state.user.profile?.personalExpenses || [];
      expect(expenses).toHaveLength(3);
      expect(expenses[0].label).toBe("Loyer & Charges");
      expect(expenses[1].label).toBe("Transport (métro)");
      expect(expenses[2].label).toBe("Café ☕");
    });
  });

  describe("Direct loadPersonalExpenses thunk", () => {
    it("can load expenses independently via loadPersonalExpenses thunk", async () => {
      // Arrange
      await userGateway.addPersonalExpense(userId, {
        label: "Direct Load",
        amount: 500,
      });

      // Act - Use the standalone loadPersonalExpenses thunk
      const result = await store.dispatch(loadPersonalExpenses());

      // Assert - Thunk returns the expenses
      expect(result.payload).toHaveLength(1);
      expect(result.payload).toMatchObject([
        {
          label: "Direct Load",
          amount: 500,
          userId,
        },
      ]);
    });
  });
});
