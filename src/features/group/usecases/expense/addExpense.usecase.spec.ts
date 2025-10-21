/**
 * Feature: Add expense
 * En tant que membre d'un groupe,
 * Je veux ajouter une dépense partagée,
 * Afin de suivre les dépenses communes du groupe.
 */

import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "../../../../store/appState";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { addExpenseToGroup } from "./addExpense.usecase";

describe("Feature: Add expense", () => {
  let groupGateway: InMemoryGroupGateway;
  const userId = "test-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  const createMockState = (hasGroup: boolean, groupId?: string): AppState => {
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

    const groupEntity =
      hasGroup && groupId
        ? {
            [groupId]: {
              id: groupId,
              name: "Test Group",
              currency: "EUR",
              creatorId: userId,
              members: [],
              expenses: [],
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
        ids: hasGroup ? [groupId!] : [],
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
    it("should add expense with valid name and amount", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on ajoute une dépense
      const action = addExpenseToGroup({
        groupId,
        name: "Courses",
        amount: 50,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

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
    });

    it("should trim whitespace from expense name", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on ajoute une dépense avec des espaces
      const action = addExpenseToGroup({
        groupId,
        name: "  Restaurant  ",
        amount: 80,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

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

      const mockState = createMockState(true, groupId);
      mockState.groups.entities[groupId]!.currency = "USD";
      const getState = vi.fn(() => mockState);

      // When on ajoute une dépense
      const action = addExpenseToGroup({
        groupId,
        name: "Shopping",
        amount: 100,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

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

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on ajoute une dépense
      const action = addExpenseToGroup({
        groupId,
        name: "Loyer",
        amount: 1200,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

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
      const mockState = createMockState(false);
      const getState = vi.fn(() => mockState);

      // When on essaie d'ajouter une dépense
      const action = addExpenseToGroup({
        groupId: "non-existent-group",
        name: "Test",
        amount: 50,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });

    it("should reject empty expense name", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on essaie d'ajouter une dépense avec un nom vide
      const action = addExpenseToGroup({
        groupId,
        name: "",
        amount: 50,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("vide");
      }
    });

    it("should reject whitespace-only expense name", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on essaie d'ajouter une dépense avec seulement des espaces
      const action = addExpenseToGroup({
        groupId,
        name: "   ",
        amount: 50,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("vide");
      }
    });

    it("should reject zero amount", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on essaie d'ajouter une dépense de 0€
      const action = addExpenseToGroup({
        groupId,
        name: "Test",
        amount: 0,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("supérieur à 0");
      }
    });

    it("should reject negative amount", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on essaie d'ajouter une dépense négative
      const action = addExpenseToGroup({
        groupId,
        name: "Test",
        amount: -50,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then l'ajout échoue
      expect(result.type).toBe("groups/addExpense/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("supérieur à 0");
      }
    });
  });

  describe("Business rules", () => {
    it("should mark expense as not predefined by default", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on ajoute une dépense manuelle
      const action = addExpenseToGroup({
        groupId,
        name: "Custom Expense",
        amount: 75,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

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

      const mockState = createMockState(true, groupId);
      const getState = vi.fn(() => mockState);

      // When on ajoute une dépense
      const action = addExpenseToGroup({
        groupId,
        name: "My Expense",
        amount: 60,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le créateur est l'utilisateur courant
      expect(result.type).toBe("groups/addExpense/fulfilled");
      if ("payload" in result && result.payload) {
        const payload = result.payload as { expense: { createdBy: string } };
        expect(payload.expense.createdBy).toBe(userId);
      }
    });
  });
});
