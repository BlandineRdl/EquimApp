/**
 * Feature: Charger mes dépenses personnelles
 * En tant qu'utilisateur authentifié,
 * Je veux charger toutes mes dépenses personnelles,
 * Afin de voir le détail de mes dépenses.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import type { UserGateway } from "../ports/UserGateway";

describe("Feature: Charger mes dépenses personnelles", () => {
  let userGateway: UserGateway;
  const userId = "test-user-123";

  beforeEach(async () => {
    userGateway = new InMemoryUserGateway();
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
      // Act
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
      expect(expenses).toEqual([]);
    });

    it("Charge une seule dépense", async () => {
      // Arrange
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      // Act
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
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
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
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
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
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

      // Act
      const myExpenses = await userGateway.loadPersonalExpenses(userId);
      const otherExpenses = await userGateway.loadPersonalExpenses(otherUserId);

      // Assert
      expect(myExpenses).toHaveLength(1);
      expect(myExpenses[0].label).toBe("My Rent");
      expect(myExpenses[0].userId).toBe(userId);

      expect(otherExpenses).toHaveLength(1);
      expect(otherExpenses[0].label).toBe("Other Rent");
      expect(otherExpenses[0].userId).toBe(otherUserId);
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
        const expenses = await userGateway.loadPersonalExpenses(userId);

        // Assert
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
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
      expect(expenses).toEqual([]);
    });

    it("Retourne liste vide pour utilisateur inexistant", async () => {
      // Act
      const expenses =
        await userGateway.loadPersonalExpenses("non-existent-user");

      // Assert
      expect(expenses).toEqual([]);
    });

    it("Charge correctement après suppression de dépense", async () => {
      // Arrange
      const expense1 = await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });
      const expense2 = await userGateway.addPersonalExpense(userId, {
        label: "Transport",
        amount: 100,
      });

      // Delete first expense
      await userGateway.deletePersonalExpense(userId, expense1.id);

      // Act
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
      expect(expenses).toHaveLength(1);
      expect(expenses[0].id).toBe(expense2.id);
      expect(expenses[0].label).toBe("Transport");
    });

    it("Charge correctement après modification de dépense", async () => {
      // Arrange
      const expense = await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      // Update expense
      await userGateway.updatePersonalExpense(userId, {
        id: expense.id,
        label: "Nouveau Loyer",
        amount: 900,
      });

      // Act
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
      expect(expenses).toHaveLength(1);
      expect(expenses[0]).toMatchObject({
        id: expense.id,
        label: "Nouveau Loyer",
        amount: 900,
      });
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
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
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
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
      expect(expenses).toHaveLength(3);
      expect(expenses[0].label).toBe("Loyer & Charges");
      expect(expenses[1].label).toBe("Transport (métro)");
      expect(expenses[2].label).toBe("Café ☕");
    });
  });
});
