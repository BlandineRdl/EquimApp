/**
 * Feature: Generate invitation link
 * En tant que membre d'un groupe,
 * Je veux générer un lien d'invitation,
 * Afin d'inviter d'autres personnes à rejoindre mon groupe.
 */

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
import { generateInviteLink } from "./generateInviteLink.usecase";

describe("Feature: Generate invitation link", () => {
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
    it("should generate invitation link for existing group", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      // When on génère un lien d'invitation
      const result = await store.dispatch(generateInviteLink({ groupId }));

      // Then le lien est généré
      expect(result.type).toBe("groups/generateInviteLink/fulfilled");
      if ("payload" in result && result.payload) {
        const link = result.payload as string;
        expect(link).toBeDefined();
        expect(typeof link).toBe("string");
        expect(link.length).toBeGreaterThan(0);
      }

      // Verify link is stored in state
      const state = store.getState();
      expect(state.groups.invitation.generateLink.link).toBeDefined();
    });

    it("should generate unique links for same group", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

      await store.dispatch(loadGroupById(groupId));

      // When on génère deux liens d'invitation
      const result1 = await store.dispatch(generateInviteLink({ groupId }));
      const result2 = await store.dispatch(generateInviteLink({ groupId }));

      // Then les liens sont différents
      expect(result1.type).toBe("groups/generateInviteLink/fulfilled");
      expect(result2.type).toBe("groups/generateInviteLink/fulfilled");

      if ("payload" in result1 && "payload" in result2) {
        const link1 = result1.payload as string;
        const link2 = result2.payload as string;
        expect(link1).not.toBe(link2);
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject when group does not exist in state", async () => {
      // Given un groupe qui n'existe pas dans l'état

      // When on essaie de générer un lien
      const result = await store.dispatch(
        generateInviteLink({ groupId: "non-existent-group" }),
      );

      // Then la génération échoue
      expect(result.type).toBe("groups/generateInviteLink/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("non trouvé");
      }
    });
  });
});
