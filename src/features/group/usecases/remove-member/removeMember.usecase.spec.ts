import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import type { AppError } from "../../../../types/thunk.types";
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
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await groupGateway.addMember(groupId, creatorId);
      const phantomResult = await groupGateway.addPhantomMember(
        groupId,
        "Test Member",
        2000,
      );
      const phantomMemberId = phantomResult.memberId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId,
          memberId: phantomMemberId,
        }),
      );

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

      const state = store.getState();
      const group = state.groups.entities[groupId];
      expect(
        group?.members.find((m) => m.id === phantomMemberId),
      ).toBeUndefined();
    });

    it("should recalculate shares after removing member", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await groupGateway.addMember(groupId, creatorId);
      const phantomResult = await groupGateway.addPhantomMember(
        groupId,
        "Phantom",
        2000,
      );

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId,
          memberId: phantomResult.memberId,
        }),
      );

      expect(result.type).toBe("groups/removeMember/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { shares: { shares: unknown[] } };
        expect(response.shares.shares).toBeDefined();
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId: "non-existent-group",
          memberId: "some-member",
        }),
      );

      expect(result.type).toBe("groups/removeMember/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });

    it("should reject when member does not exist", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId,
          memberId: "non-existent-member",
        }),
      );

      expect(result.type).toBe("groups/removeMember/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });

    it("should reject removing the group creator", async () => {
      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        creatorId,
      );
      const groupId = createResult.groupId;

      await groupGateway.addMember(groupId, creatorId);

      await store.dispatch(loadGroupById(groupId));

      const state = store.getState();
      const group = state.groups.entities[groupId];

      if (!group) {
        throw new Error("Group not found in store");
      }

      const creatorMemberInGroup = group.members.find(
        (m) => m.userId === creatorId,
      );

      if (!creatorMemberInGroup) {
        throw new Error("Creator member not found in group");
      }

      const result = await store.dispatch(
        removeMemberFromGroup({
          groupId,
          memberId: creatorMemberInGroup.id,
        }),
      );

      expect(result.type).toBe("groups/removeMember/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("créateur");
      }
    });
  });
});
