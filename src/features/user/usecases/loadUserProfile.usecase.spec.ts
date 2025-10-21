/**
 * Feature: Charger mon profil utilisateur
 * En tant qu'utilisateur authentifié,
 * Je veux charger mon profil complet,
 * Afin d'afficher mes informations et ma capacité.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import type { UserGateway } from "../ports/UserGateway";

describe("Feature: Charger mon profil utilisateur", () => {
  let userGateway: UserGateway;
  const userId = "test-user-123";

  beforeEach(() => {
    userGateway = new InMemoryUserGateway();
  });

  describe("Success scenarios", () => {
    it("Charge un profil existant sans dépenses", async () => {
      // Arrange
      await userGateway.createProfile({
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        currency: "EUR",
        shareRevenue: true,
      });

      // Act
      const profile = await userGateway.getProfileById(userId);

      // Assert
      expect(profile).toBeDefined();
      expect(profile?.id).toBe(userId);
      expect(profile?.pseudo).toBe("TestUser");
      expect(profile?.monthlyIncome).toBe(2000);
      expect(profile?.capacity).toBe(2000); // No expenses
    });

    it("Charge un profil avec dépenses personnelles", async () => {
      // Arrange
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

      // Act
      const profile = await userGateway.getProfileById(userId);
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
      expect(profile).toBeDefined();
      expect(expenses).toHaveLength(2);
      expect(profile?.capacity).toBe(1100); // 2000 - 800 - 100
    });

    it("Charge les dépenses personnelles associées", async () => {
      // Arrange
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

      // Act
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
      expect(expenses).toHaveLength(1);
      expect(expenses[0].label).toBe("Loyer");
      expect(expenses[0].amount).toBe(800);
      expect(expenses[0].userId).toBe(userId);
      expect(expenses[0].id).toBeDefined();
    });

    it("Retourne une liste vide si aucune dépense", async () => {
      // Arrange
      await userGateway.createProfile({
        id: userId,
        pseudo: "TestUser",
        monthlyIncome: 2000,
        currency: "EUR",
        shareRevenue: true,
      });

      // Act
      const expenses = await userGateway.loadPersonalExpenses(userId);

      // Assert
      expect(expenses).toEqual([]);
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
        // Arrange
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

        // Act
        const profile = await userGateway.getProfileById(userId);

        // Assert
        expect(profile?.capacity).toBe(capacite);
      });
    });
  });

  describe("Error scenarios", () => {
    it("Retourne null si profil inexistant", async () => {
      // Act
      const profile = await userGateway.getProfileById("non-existent-user");

      // Assert
      expect(profile).toBeNull();
    });

    it("Retourne liste vide si utilisateur inexistant (loadPersonalExpenses)", async () => {
      // Act
      const expenses =
        await userGateway.loadPersonalExpenses("non-existent-user");

      // Assert
      expect(expenses).toEqual([]);
    });
  });

  describe("Edge cases", () => {
    it("Gère un profil avec revenu à 0", async () => {
      // Arrange
      await userGateway.createProfile({
        id: userId,
        pseudo: "NoIncome",
        monthlyIncome: 0,
        currency: "EUR",
        shareRevenue: false,
      });

      // Act
      const profile = await userGateway.getProfileById(userId);

      // Assert
      expect(profile?.monthlyIncome).toBe(0);
      expect(profile?.capacity).toBe(0);
    });

    it("Gère une capacité négative", async () => {
      // Arrange
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

      // Act
      const profile = await userGateway.getProfileById(userId);

      // Assert
      expect(profile?.capacity).toBe(-500);
    });

    it("Gère de très nombreuses dépenses", async () => {
      // Arrange
      await userGateway.createProfile({
        id: userId,
        pseudo: "ManyExpenses",
        monthlyIncome: 3000,
        currency: "EUR",
        shareRevenue: true,
      });

      // Add 50 expenses of 10€ each
      for (let i = 0; i < 50; i++) {
        await userGateway.addPersonalExpense(userId, {
          label: `Dépense ${i + 1}`,
          amount: 10,
        });
      }

      // Act
      const expenses = await userGateway.loadPersonalExpenses(userId);
      const profile = await userGateway.getProfileById(userId);

      // Assert
      expect(expenses).toHaveLength(50);
      expect(profile?.capacity).toBe(2500); // 3000 - (50 * 10)
    });
  });
});
