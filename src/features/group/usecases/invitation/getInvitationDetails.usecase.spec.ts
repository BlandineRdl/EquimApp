/**
 * Feature: Get invitation details
 * En tant qu'utilisateur,
 * Je veux voir les détails d'une invitation,
 * Afin de décider si je veux rejoindre le groupe.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { getInvitationDetails } from "./getInvitationDetails.usecase";

describe("Feature: Get invitation details", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });
  });

  describe("Success scenarios", () => {
    it("should return invitation details for valid token", async () => {
      // Given un groupe avec une invitation
      const createResult = await groupGateway.createGroup("Ma Coloc", "EUR");
      const groupId = createResult.groupId;

      await groupGateway.addMember(groupId, "creator-id");
      const inviteResult = await groupGateway.generateInvitation(groupId);
      const token = inviteResult.token;

      // When on récupère les détails de l'invitation
      const result = await store.dispatch(getInvitationDetails({ token }));

      // Then les détails sont retournés
      expect(result.type).toBe("groups/getInvitationDetails/fulfilled");
      if ("payload" in result && result.payload) {
        const details = result.payload as {
          groupName: string;
          creatorPseudo: string;
          expiresAt: string | null;
          isConsumed: boolean;
        };
        expect(details.groupName).toBe("Ma Coloc");
        expect(details.creatorPseudo).toBeDefined();
        expect(details.expiresAt).toBeNull();
        expect(details.isConsumed).toBe(false);
      }

      // Verify details are stored in state
      const state = store.getState();
      expect(state.groups.invitation.details.data).toBeDefined();
    });

    it("should return null for non-existent token", async () => {
      // Given un token qui n'existe pas
      const token = "non-existent-token";

      // When on récupère les détails
      const result = await store.dispatch(getInvitationDetails({ token }));

      // Then null est retourné
      expect(result.type).toBe("groups/getInvitationDetails/fulfilled");
      if ("payload" in result) {
        expect(result.payload).toBeNull();
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject empty token", async () => {
      // Given un token vide
      const token = "";

      // When on récupère les détails
      const result = await store.dispatch(getInvitationDetails({ token }));

      // Then la récupération échoue
      expect(result.type).toBe("groups/getInvitationDetails/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("invalide");
      }
    });

    it("should reject whitespace-only token", async () => {
      // Given un token avec seulement des espaces
      const token = "   ";

      // When on récupère les détails
      const result = await store.dispatch(getInvitationDetails({ token }));

      // Then la récupération échoue
      expect(result.type).toBe("groups/getInvitationDetails/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("invalide");
      }
    });
  });
});
