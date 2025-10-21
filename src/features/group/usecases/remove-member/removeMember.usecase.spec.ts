/**
 * Feature: Remove member
 * En tant que créateur ou administrateur d'un groupe,
 * Je veux retirer un membre du groupe,
 * Afin de gérer les participants du groupe.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { removeMemberFromGroup } from "./removeMember.usecase";

describe("Feature: Remove member", () => {
  let groupGateway: InMemoryGroupGateway;
  const creatorId = "creator-user-id";
  const memberId = "member-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  describe("Success scenarios", () => {
    it("should remove member from group successfully", async () => {
      // Given un groupe avec plusieurs membres
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      // Add creator and member
      await groupGateway.addMember(groupId, creatorId);
      const phantomResult = await groupGateway.addPhantomMember(
        groupId,
        "Test Member",
        2000,
      );
      const phantomMemberId = phantomResult.memberId;

      // Get actual group for state
      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
              creatorId: creatorId,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on retire le membre
      const action = removeMemberFromGroup({
        groupId,
        memberId: phantomMemberId,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le retrait réussit
      expect(result.type).toBe("groups/removeMember/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          groupId: string;
          memberId: string;
          shares: { totalExpenses: number };
        };
        expect(response.groupId).toBe(groupId);
        expect(response.memberId).toBe(phantomMemberId);
        expect(response.shares).toBeDefined();
      }
    });

    it("should recalculate shares after removing member", async () => {
      // Given un groupe avec des membres
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await groupGateway.addMember(groupId, creatorId);
      const phantomResult = await groupGateway.addPhantomMember(
        groupId,
        "Phantom",
        2000,
      );

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
              creatorId: creatorId,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on retire un membre
      const action = removeMemberFromGroup({
        groupId,
        memberId: phantomResult.memberId,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then les parts sont recalculées
      expect(result.type).toBe("groups/removeMember/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { shares: { shares: unknown[] } };
        expect(response.shares.shares).toBeDefined();
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      // Given un groupe qui n'existe pas
      const mockState = {
        groups: {
          entities: {},
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie de retirer un membre
      const action = removeMemberFromGroup({
        groupId: "non-existent-group",
        memberId: "some-member",
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le retrait échoue
      expect(result.type).toBe("groups/removeMember/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });

    it("should reject when member does not exist", async () => {
      // Given un groupe sans le membre spécifié
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      const actualGroup = await groupGateway.getGroupById(groupId);
      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie de retirer un membre inexistant
      const action = removeMemberFromGroup({
        groupId,
        memberId: "non-existent-member",
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le retrait échoue
      expect(result.type).toBe("groups/removeMember/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });

    it("should reject removing the group creator", async () => {
      // Given un groupe avec le créateur
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await groupGateway.addMember(groupId, creatorId);

      const actualGroup = await groupGateway.getGroupById(groupId);

      // Find the actual member that has the creator's userId
      const creatorMemberInGroup = actualGroup.members.find(
        (m) => m.userId === creatorId,
      );

      if (!creatorMemberInGroup) {
        throw new Error("Creator member not found in group");
      }

      const mockState = {
        groups: {
          entities: {
            [groupId]: {
              ...actualGroup,
              totalMonthlyBudget: actualGroup.shares.totalExpenses,
              creatorId: creatorId,
            },
          },
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie de retirer le créateur
      const action = removeMemberFromGroup({
        groupId,
        memberId: creatorMemberInGroup.id,
      });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le retrait échoue
      expect(result.type).toBe("groups/removeMember/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("créateur");
      }
    });
  });
});
