/**
 * Feature: Delete group
 * En tant que créateur d'un groupe,
 * Je veux supprimer mon groupe,
 * Afin de nettoyer les groupes que je n'utilise plus.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
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
      // Given un créateur connecté avec un groupe
      await setupAuthSession(creatorUserId);

      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        `user-${creatorUserId}`,
      );
      const groupId = createResult.groupId;

      // Load group into store
      await store.dispatch(loadGroupById(groupId));

      // When on supprime le groupe
      const result = await store.dispatch(deleteGroup({ groupId }));

      // Then la suppression réussit
      expect(result.type).toBe("groups/deleteGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const deleted = result.payload as { groupId: string };
        expect(deleted.groupId).toBe(groupId);
      }

      // Verify group is removed from store
      const finalState = store.getState();
      expect(finalState.groups.entities[groupId]).toBeUndefined();
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      // Given un groupe qui n'existe pas dans l'état
      await setupAuthSession(creatorUserId);

      // When on essaie de supprimer le groupe
      const result = await store.dispatch(
        deleteGroup({ groupId: "non-existent-group" }),
      );

      // Then la suppression échoue
      expect(result.type).toBe("groups/deleteGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });

    it("should reject when user is not the creator", async () => {
      // Given un utilisateur qui n'est pas le créateur
      await setupAuthSession(otherUserId);

      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        `user-${creatorUserId}`,
      );
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      // When on essaie de supprimer le groupe
      const result = await store.dispatch(deleteGroup({ groupId }));

      // Then la suppression échoue
      expect(result.type).toBe("groups/deleteGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("créateur");
      }
    });

    it("should reject when user is not authenticated", async () => {
      // Given un utilisateur non authentifié
      await authGateway.signOut();
      await store.dispatch(initSession());

      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        "some-creator",
      );
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      // When on essaie de supprimer le groupe
      const result = await store.dispatch(deleteGroup({ groupId }));

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
      await setupAuthSession(creatorUserId);

      const createResult = await groupGateway.createGroup(
        "Test Group",
        "EUR",
        `user-${creatorUserId}`,
      );
      const groupId = createResult.groupId;

      // Creator tries to delete
      await store.dispatch(loadGroupById(groupId));

      const creatorResult = await store.dispatch(deleteGroup({ groupId }));

      // Then le créateur peut supprimer
      expect(creatorResult.type).toBe("groups/deleteGroup/fulfilled");

      // Recreate group for other user test
      const createResult2 = await groupGateway.createGroup(
        "Test Group 2",
        "EUR",
        `user-${creatorUserId}`,
      );
      const groupId2 = createResult2.groupId;

      // Other user tries to delete
      await setupAuthSession(otherUserId);
      await store.dispatch(loadGroupById(groupId2));

      const otherResult = await store.dispatch(
        deleteGroup({ groupId: groupId2 }),
      );

      // Then l'autre utilisateur ne peut pas supprimer
      expect(otherResult.type).toBe("groups/deleteGroup/rejected");
    });
  });
});
