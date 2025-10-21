/**
 * Feature: Leave group
 * En tant que membre d'un groupe,
 * Je veux quitter le groupe,
 * Afin de ne plus partager mes dépenses avec ce groupe.
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
      // Given un groupe avec l'utilisateur comme membre
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      // When on quitte le groupe
      const result = await store.dispatch(leaveGroup({ groupId }));

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

      // Verify group is removed from store
      const state = store.getState();
      expect(state.groups.entities[groupId]).toBeUndefined();
    });

    it("should indicate when group is deleted (last member)", async () => {
      // Given un groupe avec un seul membre
      const createResult = await groupGateway.createGroup("Solo Group", "EUR");
      const groupId = createResult.groupId;
      await groupGateway.addMember(groupId, userId);

      await store.dispatch(loadGroupById(groupId));

      // When le dernier membre quitte
      const result = await store.dispatch(leaveGroup({ groupId }));

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

      await store.dispatch(loadGroupById(groupId));

      // When un membre quitte
      const result = await store.dispatch(leaveGroup({ groupId }));

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

      // When on essaie de quitter
      const result = await store.dispatch(
        leaveGroup({ groupId: "non-existent-group" }),
      );

      // Then la sortie échoue
      expect(result.type).toBe("groups/leaveGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });
  });
});
