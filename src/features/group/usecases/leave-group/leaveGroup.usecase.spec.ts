/**
 * Feature: Leave group
 * En tant que membre d'un groupe,
 * Je veux quitter le groupe,
 * Afin de ne plus partager mes dépenses avec ce groupe.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { leaveGroup } from "./leaveGroup.usecase";

describe("Feature: Leave group", () => {
  let groupGateway: InMemoryGroupGateway;
  const userId = "test-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  describe("Success scenarios", () => {
    it("should leave group successfully", async () => {
      // Given un groupe avec l'utilisateur comme membre
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              id: groupId,
              name: "Test Group",
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on quitte le groupe
      const action = leaveGroup({ groupId });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then on quitte avec succès
      expect(result.type).toBe("groups/leaveGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          groupId: string;
          groupDeleted: boolean;
        };
        expect(response.groupId).toBe(groupId);
        expect(response.groupDeleted).toBeDefined();
      }
    });

    it("should indicate when group is deleted (last member)", async () => {
      // Given un groupe avec un seul membre
      const createResult = await groupGateway.createGroup("Solo Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              id: groupId,
              name: "Solo Group",
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When le dernier membre quitte
      const action = leaveGroup({ groupId });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le groupe est supprimé
      expect(result.type).toBe("groups/leaveGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { groupDeleted: boolean };
        expect(response.groupDeleted).toBe(true);
      }
    });

    it("should not delete group when other members remain", async () => {
      // Given un groupe avec plusieurs membres
      const createResult = await groupGateway.createGroup("Multi Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);
      await groupGateway.addMember(groupId, "other-user-id");

      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              id: groupId,
              name: "Multi Group",
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When un membre quitte
      const action = leaveGroup({ groupId });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le groupe n'est pas supprimé
      expect(result.type).toBe("groups/leaveGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { groupDeleted: boolean };
        expect(response.groupDeleted).toBe(false);
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      // Given un groupe qui n'existe pas dans l'état
      const mockState = {
        groups: {
          entities: {},
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie de quitter
      const action = leaveGroup({ groupId: "non-existent-group" });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la sortie échoue
      expect(result.type).toBe("groups/leaveGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });
  });
});
