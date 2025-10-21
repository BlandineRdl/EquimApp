/**
 * Feature: Gérer mes dépenses personnelles
 * En tant qu'utilisateur authentifié,
 * Je veux ajouter une dépense,
 * Afin de voir ma capacité restante mise à jour.
 */

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
      await store.dispatch(
        addPersonalExpense({
          label: "Loyer",
          amount: 800,
        }),
      );

      // Assert - Redux state is updated
      const state = store.getState();
      expect(state.user.profile).toBeDefined();
      expect(state.user.profile?.personalExpenses).toHaveLength(1);
      expect(state.user.profile?.personalExpenses?.[0].label).toBe("Loyer");
      expect(state.user.profile?.personalExpenses?.[0].amount).toBe(800);
      expect(state.user.profile?.capacity).toBe(1200);
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
      await store.dispatch(
        addPersonalExpense({
          label: "Loyer",
          amount: 2500,
        }),
      );

      // Assert - Capacity can be negative
      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(-500);
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
      await store.dispatch(
        addPersonalExpense({
          label: "Loyer",
          amount: 800,
        }),
      );

      // Act - Add second expense
      await store.dispatch(
        addPersonalExpense({
          label: "Transport",
          amount: 100,
        }),
      );

      // Assert - Capacity reflects both expenses
      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(1100);

      // Assert - Both expenses exist
      expect(state.user.profile?.personalExpenses).toHaveLength(2);
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
      await store.dispatch(
        addPersonalExpense({
          label: "Café",
          amount: 3.5,
        }),
      );

      // Assert
      const state = store.getState();
      expect(state.user.profile?.capacity).toBe(1996.5);
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

        // Load profile into state
        await store.dispatch(loadUserProfile());

        // Act
        await store.dispatch(
          addPersonalExpense({
            label,
            amount: montant,
          }),
        );

        // Assert
        const state = store.getState();
        expect(state.user.profile?.capacity).toBe(capacite);
      });
    });
  });
});
