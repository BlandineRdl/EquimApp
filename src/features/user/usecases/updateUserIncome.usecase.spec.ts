/**
 * Feature: Mettre à jour mon revenu mensuel
 * En tant qu'utilisateur authentifié,
 * Je veux modifier mon revenu mensuel,
 * Afin de refléter mes changements financiers.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUserGateway } from "../infra/InMemoryUserGateway";
import type { UserGateway } from "../ports/UserGateway";

describe("Feature: Mettre à jour mon revenu mensuel", () => {
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
    it("Met à jour le revenu mensuel", async () => {
      // Act
      await userGateway.updateProfile(userId, { monthlyIncome: 2500 });

      // Assert
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.monthlyIncome).toBe(2500);
    });

    it("Recalcule la capacité après mise à jour du revenu", async () => {
      // Arrange - Add expense
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 800,
      });

      // Act - Update income
      await userGateway.updateProfile(userId, { monthlyIncome: 3000 });

      // Assert - Capacity should be 3000 - 800 = 2200
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.capacity).toBe(2200);
    });

    it("Peut augmenter le revenu", async () => {
      // Act
      await userGateway.updateProfile(userId, { monthlyIncome: 2500 });

      // Assert
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.monthlyIncome).toBe(2500);
      expect(profile?.capacity).toBe(2500);
    });

    it("Peut diminuer le revenu", async () => {
      // Act
      await userGateway.updateProfile(userId, { monthlyIncome: 1500 });

      // Assert
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.monthlyIncome).toBe(1500);
      expect(profile?.capacity).toBe(1500);
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
          }

          // Act
          await userGateway.updateProfile(userId, {
            monthlyIncome: nouveauRevenu,
          });

          // Assert
          const profile = await userGateway.getProfileById(userId);
          expect(profile?.capacity).toBe(capacite);
        });
      },
    );
  });

  describe("Edge cases", () => {
    it("Revenu à 0 est accepté", async () => {
      // Act
      await userGateway.updateProfile(userId, { monthlyIncome: 0 });

      // Assert
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.monthlyIncome).toBe(0);
      expect(profile?.capacity).toBe(0);
    });

    it("Capacité négative si dépenses > revenu", async () => {
      // Arrange
      await userGateway.addPersonalExpense(userId, {
        label: "Loyer",
        amount: 1500,
      });

      // Act
      await userGateway.updateProfile(userId, { monthlyIncome: 1000 });

      // Assert
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.capacity).toBe(-500);
    });
  });

  describe("Error scenarios", () => {
    it("Erreur si utilisateur inexistant", async () => {
      // Act & Assert
      await expect(
        userGateway.updateProfile("non-existent-user", { monthlyIncome: 2500 }),
      ).rejects.toThrow("Profile not found");
    });
  });
});
