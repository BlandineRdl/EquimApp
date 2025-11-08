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
import { leaveGroup } from "./leaveGroup.usecase";

describe("Feature: Leave group", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;
  const userId = "test-user-id";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });
  });

  describe("Success scenarios", () => {
    it("should leave group successfully", async () => {
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(leaveGroup({ groupId }));

      expect(result.type).toBe("groups/leaveGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as {
          groupId: string;
          groupDeleted: boolean;
        };
        expect(response.groupId).toBe(groupId);
        expect(response.groupDeleted).toBeDefined();
      }

      const state = store.getState();
      expect(state.groups.entities[groupId]).toBeUndefined();
    });

    it("should indicate when group is deleted (last member)", async () => {
      const createResult = await groupGateway.createGroup("Solo Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(leaveGroup({ groupId }));

      expect(result.type).toBe("groups/leaveGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { groupDeleted: boolean };
        expect(response.groupDeleted).toBe(true);
      }
    });

    it("should not delete group when other members remain", async () => {
      const createResult = await groupGateway.createGroup("Multi Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);
      await groupGateway.addMember(groupId, "other-user-id");

      await store.dispatch(loadGroupById(groupId));

      const result = await store.dispatch(leaveGroup({ groupId }));

      expect(result.type).toBe("groups/leaveGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { groupDeleted: boolean };
        expect(response.groupDeleted).toBe(false);
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      const result = await store.dispatch(
        leaveGroup({ groupId: "non-existent-group" }),
      );

      expect(result.type).toBe("groups/leaveGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });
  });
});
