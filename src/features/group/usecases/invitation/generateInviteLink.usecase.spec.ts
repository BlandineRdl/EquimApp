/**
 * Feature: Generate invitation link
 * En tant que membre d'un groupe,
 * Je veux générer un lien d'invitation,
 * Afin d'inviter d'autres personnes à rejoindre mon groupe.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { generateInviteLink } from "./generateInviteLink.usecase";

describe("Feature: Generate invitation link", () => {
  let groupGateway: InMemoryGroupGateway;

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  describe("Success scenarios", () => {
    it("should generate invitation link for existing group", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

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

      // When on génère un lien d'invitation
      const action = generateInviteLink({ groupId });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then le lien est généré
      expect(result.type).toBe("groups/generateInviteLink/fulfilled");
      if ("payload" in result && result.payload) {
        const link = result.payload as string;
        expect(link).toBeDefined();
        expect(typeof link).toBe("string");
        expect(link.length).toBeGreaterThan(0);
      }
    });

    it("should generate unique links for same group", async () => {
      // Given un groupe existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;

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

      // When on génère deux liens d'invitation
      const action1 = generateInviteLink({ groupId });
      const result1 = await action1(vi.fn(), getState, { groupGateway } as any);

      const action2 = generateInviteLink({ groupId });
      const result2 = await action2(vi.fn(), getState, { groupGateway } as any);

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
      const mockState = {
        groups: {
          entities: {},
        },
      };
      const getState = vi.fn(() => mockState as any);

      // When on essaie de générer un lien
      const action = generateInviteLink({ groupId: "non-existent-group" });
      const result = await action(vi.fn(), getState, { groupGateway } as any);

      // Then la génération échoue
      expect(result.type).toBe("groups/generateInviteLink/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("non trouvé");
      }
    });
  });
});
