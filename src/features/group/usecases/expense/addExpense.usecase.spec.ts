/**
 * Feature: Add expense
 * En tant que membre d'un groupe,
 * Je veux ajouter une dépense partagée,
 * Afin de suivre les dépenses communes du groupe.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import type { AppError } from "../../../../types/thunk.types";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { initSession } from "../../../auth/usecases/manage-session/initSession.usecase";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadGroupById } from "../load-group/loadGroup.usecase";
import { addExpenseToGroup } from "./addExpense.usecase";

describe("Feature: Add expense", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;
  const userEmail = "test-user@example.com";
  const userId = `user-${userEmail}`;

  beforeEach(async () => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });

    // Setup auth session using verifyOtp and initSession
    await authGateway.verifyOtp(userEmail, "123456");
    await store.dispatch(initSession());
  });

  describe("Success scenarios", () => {
    it("should add expense with valid name and amount", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      // When on ajoute une dépense
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Courses",
          amount: 50,
        }),
      );

      // Then la dépense est ajoutée
      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as {
          groupId: string;
          expense: { id: string; name: string; amount: number };
        };
        expect(payload.groupId).toBe(groupId);
        expect(payload.expense.name).toBe("Courses");
        expect(payload.expense.amount).toBe(50);
        expect(payload.expense.id).toBeDefined();
      }

      // Verify store state
      const state = store.getState();
      const group = state.groups.entities[groupId];
      expect(group?.expenses.length).toBeGreaterThan(0);
    });

    it("should trim whitespace from expense name", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      // When on ajoute une dépense avec des espaces
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "  Restaurant  ",
          amount: 80,
        }),
      );

      // Then la dépense est ajoutée avec le nom trimmed
      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { expense: { name: string } };
        expect(payload.expense.name).toBe("Restaurant");
      }
    });

    it("should use group currency for expense", async () => {
      // Given un groupe avec une devise USD
      const createResult = await groupGateway.createGroup("US Group", "USD");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      // When on ajoute une dépense
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Shopping",
          amount: 100,
        }),
      );

      // Then la devise du groupe est utilisée
      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { expense: { currency: string } };
        expect(payload.expense.currency).toBe("USD");
      }
    });

    it("should recalculate shares after adding expense", async () => {
      // Given un groupe avec des membres
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      // When on ajoute une dépense
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Loyer",
          amount: 1200,
        }),
      );

      // Then les parts sont recalculées
      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { shares: { totalExpenses: number } };
        expect(payload.shares).toBeDefined();
        expect(payload.shares.totalExpenses).toBeDefined();
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      // Given un groupe qui n'existe pas

      // When on essaie d'ajouter une dépense
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId: "non-existent-group",
          name: "Test",
          amount: 50,
        }),
      );

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });

    it("should reject empty expense name", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      // When on essaie d'ajouter une dépense avec un nom vide
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "",
          amount: 50,
        }),
      );

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("vide");
      }
    });

    it("should reject whitespace-only expense name", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      // When on essaie d'ajouter une dépense avec seulement des espaces
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "   ",
          amount: 50,
        }),
      );

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("vide");
      }
    });

    it("should reject zero amount", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      // When on essaie d'ajouter une dépense de 0€
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Test",
          amount: 0,
        }),
      );

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("supérieur à 0");
      }
    });

    it("should reject negative amount", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      // When on essaie d'ajouter une dépense négative
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Test",
          amount: -50,
        }),
      );

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("supérieur à 0");
      }
    });
  });

  describe("Business rules", () => {
    it("should mark expense as not predefined by default", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      // When on ajoute une dépense manuelle
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "Custom Expense",
          amount: 75,
        }),
      );

      // Then la dépense n'est pas prédéfinie
      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as {
          expense: { isPredefined: boolean };
        };
        expect(payload.expense.isPredefined).toBe(false);
      }
    });

    it("should set createdBy to current user", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      // When on ajoute une dépense
      const result = await store.dispatch(
        addExpenseToGroup({
          groupId,
          name: "My Expense",
          amount: 60,
        }),
      );

      // Then le créateur est l'utilisateur courant
      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { expense: { createdBy: string } };
        expect(payload.expense.createdBy).toBe(userId);
      }
    });
  });
});
