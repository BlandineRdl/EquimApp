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
import { deleteGroup } from "./deleteGroup.usecase";

describe("Feature: Delete group", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;
  const creatorUserId = "user-creator@example.com";
  const otherUserId = "user-other@example.com";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });
  });

  const setupAuthSession = async (email: string) => {
    await authGateway.verifyOtp(email, "123456");
    await store.dispatch(initSession());
  };

  describe("Success scenarios", () => {
    it("should delete group when user is the creator", async () => {
      await setupAuthSession(creatorUserId);

      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        `user-${creatorUserId}`,
      );
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(deleteGroup({ groupId }));

      expect(result.type).toBe("groups/deleteGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as { groupId: string };
        expect(deleted.groupId).toBe(groupId);
      }

      const finalState = store.getState();
      expect(finalState.groups.entities[groupId]).toBeUndefined();
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      await setupAuthSession(creatorUserId);

      const result = await store.dispatch(
        deleteGroup({ groupId: "non-existent-group" }),
      );

      expect(result.type).toBe("groups/deleteGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });

    it("should reject when user is not the creator", async () => {
      await setupAuthSession(otherUserId);

      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        `user-${creatorUserId}`,
      );
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(deleteGroup({ groupId }));

      expect(result.type).toBe("groups/deleteGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("créateur");
      }
    });

    it("should reject when user is not authenticated", async () => {
      await authGateway.signOut();
      await store.dispatch(initSession());

      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        "some-creator",
      );
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(deleteGroup({ groupId }));

      expect(result.type).toBe("groups/deleteGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("créateur");
      }
    });
  });

  describe("Business rules", () => {
    it("should only allow creator to delete group", async () => {
      await setupAuthSession(creatorUserId);

      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        `user-${creatorUserId}`,
      );
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      const creatorResult = await store.dispatch(deleteGroup({ groupId }));

      expect(creatorResult.type).toBe("groups/deleteGroup/fulfilled");

      const createResult2 = await groupGateway.createGroup(
        "Test Group 2",
        "EUR",
        `user-${creatorUserId}`,
      );
      const groupId2 = createResult2.groupId;

      await setupAuthSession(otherUserId);
      await store.dispatch(loadGroupById(groupId2));

      const otherResult = await store.dispatch(
        deleteGroup({ groupId: groupId2 }),
      );

      expect(otherResult.type).toBe("groups/deleteGroup/rejected");
    });
  });
});
