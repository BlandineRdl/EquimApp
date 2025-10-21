/**
 * Feature: Delete group
 * En tant que créateur d'un groupe,
 * Je veux supprimer mon groupe,
 * Afin de nettoyer les groupes que je n'utilise plus.
 */

import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "../../../../store/appState";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { deleteGroup } from "./deleteGroup.usecase";

describe("Feature: Delete group", () => {
  let groupGateway: GroupGateway;
  const creatorUserId = "creator-user-id";
  const otherUserId = "other-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  const createMockState = (
    userId: string,
    hasGroup: boolean,
    groupCreatorId?: string,
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

    const groupEntity = hasGroup
      ? {
          "group-123": {
            id: "group-123",
            name: "Test Group",
            currency: "EUR",
            creatorId: groupCreatorId || creatorUserId,
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
    it("should delete group when user is the creator", async () => {
      // Given un créateur connecté avec un groupe
      // Create group in gateway first
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const mockState = createMockState(creatorUserId, true, creatorUserId);
      // Update groupId in state to match the created group
      mockState.groups.entities[groupId] = {
        id: groupId,
        name: "Test Group",
        currency: "EUR",
        creatorId: creatorUserId,
        members: [],
        expenses: [],
        shares: { totalExpenses: 0, shares: [] },
        totalMonthlyBudget: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      delete mockState.groups.entities["group-123"];

      const getState = vi.fn(() => mockState);

      // When on supprime le groupe
      const action = deleteGroup({ groupId });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la suppression réussit
      expect(result.type).toBe("groups/deleteGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as { groupId: string };
        expect(deleted.groupId).toBe(groupId);
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      // Given un groupe qui n'existe pas dans l'état
      const mockState = createMockState(creatorUserId, false);
      const getState = vi.fn(() => mockState);

      // When on essaie de supprimer le groupe
      const action = deleteGroup({ groupId: "non-existent-group" });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la suppression échoue
      expect(result.type).toBe("groups/deleteGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });

    it("should reject when user is not the creator", async () => {
      // Given un utilisateur qui n'est pas le créateur
      const mockState = createMockState(otherUserId, true, creatorUserId);
      const getState = vi.fn(() => mockState);

      // When on essaie de supprimer le groupe
      const action = deleteGroup({ groupId: "group-123" });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la suppression échoue
      expect(result.type).toBe("groups/deleteGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("créateur");
      }
    });

    it("should reject when user is not authenticated", async () => {
      // Given un utilisateur non authentifié
      const mockState = createMockState(creatorUserId, true, creatorUserId);
      mockState.auth.user = null;
      const getState = vi.fn(() => mockState);

      // When on essaie de supprimer le groupe
      const action = deleteGroup({ groupId: "group-123" });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la suppression échoue
      expect(result.type).toBe("groups/deleteGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("créateur");
      }
    });
  });

  describe("Business rules", () => {
    it("should only allow creator to delete group", async () => {
      // Given deux utilisateurs et un groupe créé par le premier
      // Create group in gateway first
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const creatorState = createMockState(creatorUserId, true, creatorUserId);
      creatorState.groups.entities[groupId] = {
        id: groupId,
        name: "Test Group",
        currency: "EUR",
        creatorId: creatorUserId,
        members: [],
        expenses: [],
        shares: { totalExpenses: 0, shares: [] },
        totalMonthlyBudget: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      delete creatorState.groups.entities["group-123"];

      const otherUserState = createMockState(otherUserId, true, creatorUserId);
      otherUserState.groups.entities[groupId] = {
        id: groupId,
        name: "Test Group",
        currency: "EUR",
        creatorId: creatorUserId,
        members: [],
        expenses: [],
        shares: { totalExpenses: 0, shares: [] },
        totalMonthlyBudget: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      delete otherUserState.groups.entities["group-123"];

      // When le créateur essaie de supprimer
      const creatorAction = deleteGroup({ groupId });
      const creatorResult = await creatorAction(
        vi.fn(),
        vi.fn(() => creatorState),
        { groupGateway } as any,
      );

      // Then le créateur peut supprimer
      expect(creatorResult.type).toBe("groups/deleteGroup/fulfilled");

      // When un autre utilisateur essaie de supprimer
      const otherAction = deleteGroup({ groupId });
      const otherResult = await otherAction(
        vi.fn(),
        vi.fn(() => otherUserState),
        { groupGateway } as any,
      );

      // Then l'autre utilisateur ne peut pas supprimer
      expect(otherResult.type).toBe("groups/deleteGroup/rejected");
    });
  });
});
