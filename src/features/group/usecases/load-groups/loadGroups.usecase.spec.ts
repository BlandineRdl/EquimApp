/**
 * Feature: Load user groups
 * En tant qu'utilisateur,
 * Je veux charger tous mes groupes,
 * Afin de voir la liste de mes groupes avec leurs détails.
 */

import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "../../../../store/appState";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { loadUserGroups } from "./loadGroups.usecase";

describe("Feature: Load user groups", () => {
  let groupGateway: InMemoryGroupGateway;
  const userId = "test-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  const createMockState = (): AppState => {
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

    return {
      auth: {
        isAuthenticated: true,
        session: mockSession,
        user: mockSession.user,
      },
      groups: {
        entities: {},
        ids: [],
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
    it("should load all user groups", async () => {
      // Given plusieurs groupes pour l'utilisateur
      const group1 = await groupGateway.createGroup("Group 1", "EUR");
      const group2 = await groupGateway.createGroup("Group 2", "USD");
      await groupGateway.addMember(group1.groupId, userId);
      await groupGateway.addMember(group2.groupId, userId);

      const mockState = createMockState();
      const getState = vi.fn(() => mockState);

      // When on charge tous les groupes
      const action = loadUserGroups();
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then tous les groupes sont chargés
      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as unknown[];
        expect(groups).toBeDefined();
        expect(groups.length).toBeGreaterThan(0);
      }
    });

    it("should return empty array when user has no groups", async () => {
      // Given un utilisateur sans groupes
      const mockState = createMockState();
      const getState = vi.fn(() => mockState);

      // When on charge les groupes
      const action = loadUserGroups();
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then un tableau vide est retourné
      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as unknown[];
        expect(groups).toEqual([]);
      }
    });

    it("should include full group details for each group", async () => {
      // Given un groupe avec membres et dépenses
      const createResult = await groupGateway.createGroup("Ma Coloc", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);
      await groupGateway.addMember(groupId, "other-user");
      await groupGateway.createExpense({
        groupId,
        name: "Loyer",
        amount: 1200,
        currency: "EUR",
        isPredefined: false,
      });

      const mockState = createMockState();
      const getState = vi.fn(() => mockState);

      // When on charge les groupes
      const action = loadUserGroups();
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then les détails complets sont inclus
      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as Array<{
          id: string;
          name: string;
          members: unknown[];
          expenses: unknown[];
          shares: { totalExpenses: number };
          totalMonthlyBudget: number;
        }>;
        expect(groups.length).toBe(1);
        expect(groups[0].name).toBe("Ma Coloc");
        expect(groups[0].members.length).toBeGreaterThan(0);
        expect(groups[0].expenses.length).toBe(1);
        expect(groups[0].shares).toBeDefined();
        expect(groups[0].totalMonthlyBudget).toBeDefined();
      }
    });

    it("should calculate totalMonthlyBudget from shares", async () => {
      // Given un groupe avec des dépenses
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);
      await groupGateway.createExpense({
        groupId,
        name: "Expense 1",
        amount: 100,
        currency: "EUR",
        isPredefined: false,
      });
      await groupGateway.createExpense({
        groupId,
        name: "Expense 2",
        amount: 50,
        currency: "EUR",
        isPredefined: false,
      });

      const mockState = createMockState();
      const getState = vi.fn(() => mockState);

      // When on charge les groupes
      const action = loadUserGroups();
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le budget mensuel total est calculé
      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as Array<{
          shares: { totalExpenses: number };
          totalMonthlyBudget: number;
        }>;
        expect(groups[0].totalMonthlyBudget).toBe(
          groups[0].shares.totalExpenses,
        );
        expect(groups[0].totalMonthlyBudget).toBe(150);
      }
    });
  });

  describe("Error scenarios", () => {
    it("should reject when user is not authenticated", async () => {
      // Given un utilisateur non authentifié
      const mockState = createMockState();
      mockState.auth.user = null;
      const getState = vi.fn(() => mockState);

      // When on essaie de charger les groupes
      const action = loadUserGroups();
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le chargement échoue
      expect(result.type).toBe("groups/loadUserGroups/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("authenticated");
      }
    });
  });

  describe("Business rules", () => {
    it("should load each group with all its data", async () => {
      // Given plusieurs groupes avec différentes données
      const group1 = await groupGateway.createGroup("Group 1", "EUR");
      const group2 = await groupGateway.createGroup("Group 2", "USD");

      await groupGateway.addMember(group1.groupId, userId);
      await groupGateway.addMember(group2.groupId, userId);

      await groupGateway.createExpense({
        groupId: group1.groupId,
        name: "Expense 1",
        amount: 100,
        currency: "EUR",
        isPredefined: false,
      });

      const mockState = createMockState();
      const getState = vi.fn(() => mockState);

      // When on charge tous les groupes
      const action = loadUserGroups();
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then chaque groupe a toutes ses données
      expect(result.type).toBe("groups/loadUserGroups/fulfilled");
      if ("payload" in result && result.payload) {
        const groups = result.payload as Array<{
          id: string;
          name: string;
          currency: string;
          members: unknown[];
          expenses: unknown[];
        }>;
        expect(groups.length).toBe(2);

        // Group 1 should have expense
        const loadedGroup1 = groups.find((g) => g.name === "Group 1");
        expect(loadedGroup1).toBeDefined();
        expect(loadedGroup1!.expenses.length).toBe(1);
        expect(loadedGroup1!.currency).toBe("EUR");

        // Group 2 should have no expenses
        const loadedGroup2 = groups.find((g) => g.name === "Group 2");
        expect(loadedGroup2).toBeDefined();
        expect(loadedGroup2!.expenses.length).toBe(0);
        expect(loadedGroup2!.currency).toBe("USD");
      }
    });
  });
});
