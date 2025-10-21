/**
 * Feature: Remove member
 * En tant que créateur ou administrateur d'un groupe,
 * Je veux retirer un membre du groupe,
 * Afin de gérer les participants du groupe.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { loadGroupById } from "../load-group/loadGroup.usecase";
import { removeMemberFromGroup } from "./removeMember.usecase";

describe("Feature: Remove member", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;
  const creatorId = "creator-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });
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

      await store.dispatch(loadGroupById(groupId));

      // When on retire le membre
      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId,
          memberId: phantomMemberId,
        }),
      );

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

      // Verify member is removed from store
      const state = store.getState();
      const group = state.groups.entities[groupId];
      expect(
        group?.members.find((m) => m.id === phantomMemberId),
      ).toBeUndefined();
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

      await store.dispatch(loadGroupById(groupId));

      // When on retire un membre
      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId,
          memberId: phantomResult.memberId,
        }),
      );

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

      // When on essaie de retirer un membre
      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId: "non-existent-group",
          memberId: "some-member",
        }),
      );

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

      await store.dispatch(loadGroupById(groupId));

      // When on essaie de retirer un membre inexistant
      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId,
          memberId: "non-existent-member",
        }),
      );

      // Then le retrait échoue
      expect(result.type).toBe("groups/removeMember/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });

    it("should reject removing the group creator", async () => {
      // Given un groupe avec le créateur
      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        creatorId,
      );
      const groupId = createResult.groupId;

      await groupGateway.addMember(groupId, creatorId);

      await store.dispatch(loadGroupById(groupId));

      // Get the group from state
      const state = store.getState();
      const group = state.groups.entities[groupId];

      if (!group) {
        throw new Error("Group not found in store");
      }

      // Find the actual member that has the creator's userId
      const creatorMemberInGroup = group.members.find(
        (m) => m.userId === creatorId,
      );

      if (!creatorMemberInGroup) {
        throw new Error("Creator member not found in group");
      }

      // When on essaie de retirer le créateur
      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId,
          memberId: creatorMemberInGroup.id,
        }),
      );

      // Then le retrait échoue
      expect(result.type).toBe("groups/removeMember/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("créateur");
      }
    });
  });
});
