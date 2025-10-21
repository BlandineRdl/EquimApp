/**
 * Feature: Delete expense
 * En tant que membre d'un groupe,
 * Je veux supprimer une dépense,
 * Afin de corriger une erreur ou retirer une dépense obsolète.
 */

import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "../../../../store/appState";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { deleteExpense } from "./deleteExpense.usecase";

describe("Feature: Delete expense", () => {
  let groupGateway: InMemoryGroupGateway;
  const userId = "test-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  const createMockState = (
    hasGroup: boolean,
    hasExpense: boolean,
    expenseId?: string,
  ): AppState => {
    const mockSession: Session = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: "bearer",
      user: {
        id: userId,
        email: "user@example.com",
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };

    const expenses =
      hasExpense && expenseId
        ? [
            {
              id: expenseId,
              groupId: "group-123",
              name: "Test Expense",
              amount: 50,
              currency: "EUR",
              isPredefined: false,
              createdBy: userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
        : [];

    const groupEntity = hasGroup
      ? {
          "group-123": {
            id: "group-123",
            name: "Test Group",
            currency: "EUR",
            creatorId: userId,
            members: [],
            expenses,
            shares: { totalExpenses: 0, shares: [] },
          },
        }
      : {};

    return {
      auth: {
        isAuthenticated: true,
        session: mockSession,
        user: mockSession.user,
      },
      groups: {
        entities: groupEntity,
        ids: hasGroup ? ["group-123"] : [],
        loading: false,
        error: null,
        details: {
          loading: false,
          data: null,
          error: null,
        },
      },
    } as any as AppState;
  };

  describe("Success scenarios", () => {
    it("should delete expense successfully", async () => {
      // Given un groupe avec une dépense
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const expenseResult = await groupGateway.createExpense({
        groupId,
        name: "Test Expense",
        amount: 50,
        currency: "EUR",
        isPredefined: false,
      });
      const expenseId = expenseResult.expenseId;

      // Get the actual group from gateway to use in state
      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = createMockState(true, true, expenseId);
      (mockState.groups.entities as any)[groupId] = {
        ...actualGroup,
        totalMonthlyBudget: actualGroup.shares.totalExpenses,
      };
      delete (mockState.groups.entities as any)["group-123"];

      const getState = vi.fn(() => mockState);

      // When on supprime la dépense
      const action = deleteExpense({ groupId, expenseId });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la suppression réussit
      expect(result.type).toBe("groups/deleteExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as {
          groupId: string;
          expenseId: string;
        };
        expect(deleted.groupId).toBe(groupId);
        expect(deleted.expenseId).toBe(expenseId);
      }
    });

    it("should recalculate shares after deleting expense", async () => {
      // Given un groupe avec une dépense
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const expenseResult = await groupGateway.createExpense({
        groupId,
        name: "Test Expense",
        amount: 100,
        currency: "EUR",
        isPredefined: false,
      });
      const expenseId = expenseResult.expenseId;

      const mockState = createMockState(true, true, expenseId);
      (mockState.groups.entities as any)[groupId] = {
        id: groupId,
        name: "Test Group",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [
          {
            id: expenseId,
            groupId,
            name: "Test Expense",
            amount: 100,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        shares: { totalExpenses: 100, shares: [] },
      };
      delete (mockState.groups.entities as any)["group-123"];

      const getState = vi.fn(() => mockState);

      // When on supprime la dépense
      const action = deleteExpense({ groupId, expenseId });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then les parts sont recalculées
      expect(result.type).toBe("groups/deleteExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as { shares: { totalExpenses: number } };
        expect(deleted.shares).toBeDefined();
        expect(deleted.shares.totalExpenses).toBeDefined();
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      // Given un groupe qui n'existe pas
      const mockState = createMockState(false, false);
      const getState = vi.fn(() => mockState);

      // When on essaie de supprimer une dépense
      const action = deleteExpense({
        groupId: "non-existent-group",
        expenseId: "some-expense",
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la suppression échoue
      expect(result.type).toBe("groups/deleteExpense/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });

    it("should reject when expense does not exist", async () => {
      // Given un groupe sans la dépense spécifiée
      const mockState = createMockState(true, false);
      const getState = vi.fn(() => mockState);

      // When on essaie de supprimer une dépense qui n'existe pas
      const action = deleteExpense({
        groupId: "group-123",
        expenseId: "non-existent-expense",
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la suppression échoue
      expect(result.type).toBe("groups/deleteExpense/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvée");
      }
    });
  });

  describe("Business rules", () => {
    it("should update group budget after deleting expense", async () => {
      // Given un groupe avec plusieurs dépenses
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      // Create two expenses
      const expense1 = await groupGateway.createExpense({
        groupId,
        name: "Expense 1",
        amount: 100,
        currency: "EUR",
        isPredefined: false,
      });

      const expense2 = await groupGateway.createExpense({
        groupId,
        name: "Expense 2",
        amount: 50,
        currency: "EUR",
        isPredefined: false,
      });

      const mockState = createMockState(true, true, expense1.expenseId);
      (mockState.groups.entities as any)[groupId] = {
        id: groupId,
        name: "Test Group",
        currency: "EUR",
        creatorId: userId,
        members: [],
        expenses: [
          {
            id: expense1.expenseId,
            groupId,
            name: "Expense 1",
            amount: 100,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: expense2.expenseId,
            groupId,
            name: "Expense 2",
            amount: 50,
            currency: "EUR",
            isPredefined: false,
            createdBy: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        shares: { totalExpenses: 150, shares: [] },
      };
      delete mockState.groups.entities["group-123"];

      const getState = vi.fn(() => mockState);

      // When on supprime la première dépense
      const action = deleteExpense({
        groupId,
        expenseId: expense1.expenseId,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le budget total est mis à jour
      expect(result.type).toBe("groups/deleteExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as { shares: { totalExpenses: number } };
        // After deleting 100€ expense, only 50€ should remain
        expect(deleted.shares.totalExpenses).toBe(50);
      }
    });
  });
});
