/**
 * Feature: Gérer mes dépenses personnelles
 * En tant qu'utilisateur authentifié,
 * Je veux ajouter une dépense,
 * Afin de voir ma capacité restante mise à jour.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import type { UserGateway } from "../ports/UserGateway";

describe("Feature: Gérer mes dépenses personnelles", () => {
  let userGateway: UserGateway;
  const userId = "test-user-123";

  beforeEach(async () => {
    // Arrange - Setup infrastructure
    userGateway = new InMemoryUserGateway();

    // Arrange - Create user profile with 2000€ monthly income
    // NOTE: Using domain vocabulary (monthlyIncome), not infra vocabulary (income)
    await userGateway.createProfile({
      id: userId,
      pseudo: "TestUser",
      monthlyIncome: 2000,
      currency: "EUR",
      shareRevenue: true,
    });
  });

  describe("Success scenarios", () => {
    /**
     * Scénario: Ajouter un loyer diminue la capacité
     *   Given un utilisateur avec 2000€ de revenu mensuel
     *   And aucune dépense existante
     *   When j'ajoute une dépense "Loyer" de 800€
     *   Then la dépense est créée avec succès
     *   And ma capacité restante est de 1200€
     */
    it("Ajouter un loyer diminue la capacité", async () => {
      // Act
      const expense = await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      // Assert - Expense is created
      expect(expense.id).toBeDefined();
      expect(expense.label).toBe("Loyer");
      expect(expense.amount).toBe(800);

      // Assert - Capacity is updated
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.capacity).toBe(1200);
    });

    /**
     * Scénario: Autoriser une capacité négative si dépenses > revenu
     *   Given un utilisateur avec 2000€ de revenu mensuel
     *   When j'ajoute une dépense "Loyer" de 2500€
     *   Then la dépense est créée
     *   And ma capacité restante est de -500€
     */
    it("Autoriser une capacité négative si dépenses > revenu", async () => {
      // Act
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 2500,
      });

      // Assert - Capacity can be negative
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.capacity).toBe(-500);
    });

    /**
     * Scénario: Ajouter plusieurs dépenses accumule les montants
     *   Given un utilisateur avec 2000€ de revenu
     *   And une dépense existante "Loyer" de 800€
     *   When j'ajoute une dépense "Transport" de 100€
     *   Then ma capacité restante est de 1100€
     *   And j'ai 2 dépenses au total
     */
    it("Ajouter plusieurs dépenses accumule les montants", async () => {
      // Arrange - Add first expense
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      // Act - Add second expense
      await userGateway.addPersonalExpense(userId, {
        label: "Transport",
        amount: 100,
      });

      // Assert - Capacity reflects both expenses
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.capacity).toBe(1100);

      // Assert - Both expenses exist
      const expenses = await userGateway.loadPersonalExpenses(userId);
      expect(expenses).toHaveLength(2);
    });

    /**
     * Scénario: Accepter des montants décimaux
     *   Given un utilisateur avec 2000€ de revenu
     *   When j'ajoute une dépense "Café" de 3.50€
     *   Then la dépense est créée
     *   And ma capacité est de 1996.50€
     */
    it("Accepter des montants décimaux", async () => {
      // Act
      await userGateway.addPersonalExpense(userId, {
        label: "Café",
        amount: 3.5,
      });

      // Assert
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.capacity).toBe(1996.5);
    });
  });

  describe("Business rules", () => {
    /**
     * Scénario Outline: Calcul de capacité selon le revenu et les dépenses
     *   Given un revenu mensuel de <revenu>€
     *   When j'ajoute une dépense "<label>" de <montant>€
     *   Then ma capacité restante est de <capacite>€
     *
     * Exemples:
     * | revenu | label     | montant | capacite |
     * | 2000   | Loyer     | 800     | 1200     |
     * | 2000   | Loyer     | 2500    | -500     |
     * | 3000   | Transport | 150     | 2850     |
     * | 1500   | Courses   | 1500    | 0        |
     */
    describe.each([
      { revenu: 2000, label: "Loyer", montant: 800, capacite: 1200 },
      { revenu: 2000, label: "Loyer", montant: 2500, capacite: -500 },
      { revenu: 3000, label: "Transport", montant: 150, capacite: 2850 },
      { revenu: 1500, label: "Courses", montant: 1500, capacite: 0 },
    ])("Calcul de capacité", ({ revenu, label, montant, capacite }) => {
      it(`Revenu ${revenu}€ - ${label} ${montant}€ → Capacité ${capacite}€`, async () => {
        // Arrange - Create user with specific income
        const testUserId = `user-${revenu}`;
        await userGateway.createProfile({
          id: testUserId,
          pseudo: "TestUser",
          monthlyIncome: revenu,
          currency: "EUR",
          shareRevenue: true,
        });

        // Act
        await userGateway.addPersonalExpense(testUserId, {
          label,
          amount: montant,
        });

        // Assert
        const profile = await userGateway.getProfileById(testUserId);
        expect(profile?.capacity).toBe(capacite);
      });
    });
  });
});
