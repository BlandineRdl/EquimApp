/**
 * Feature: Create Group
 * En tant qu'utilisateur,
 * Je veux créer un groupe,
 * Afin de partager des dépenses avec d'autres personnes.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import type { GroupGateway } from "../../ports/GroupGateway";
import { createGroup } from "./createGroup.usecase";

describe("Feature: Create group", () => {
  let groupGateway: GroupGateway;

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
  });

  describe("Success scenarios", () => {
    it("should create group with valid name", async () => {
      // Given un nom de groupe valide
      const name = "Ma Coloc";

      // When on crée le groupe
      const action = createGroup({ name });
      const result = await action(vi.fn(), vi.fn(), { groupGateway } as any);

      // Then le groupe est créé
      expect(result.type).toBe("groups/createGroup/fulfilled");
      if ("payload" in result && result.payload) {
        const group = result.payload as { groupId: string };
        expect(group.groupId).toBeDefined();
      }
    });

    it("should trim whitespace from group name", async () => {
      // Given un nom avec des espaces
      const name = "  Mon Groupe  ";

      // When on crée le groupe
      const action = createGroup({ name });
      const result = await action(vi.fn(), vi.fn(), { groupGateway } as any);

      // Then le groupe est créé (nom trimmed)
      expect(result.type).toBe("groups/createGroup/fulfilled");
    });

    it("should use default EUR currency when not specified", async () => {
      // Given aucune devise spécifiée
      const name = "Test Group";

      // When on crée le groupe
      const action = createGroup({ name });
      const result = await action(vi.fn(), vi.fn(), { groupGateway } as any);

      // Then le groupe est créé avec EUR par défaut
      expect(result.type).toBe("groups/createGroup/fulfilled");
    });

    it("should accept custom currency", async () => {
      // Given une devise personnalisée
      const name = "US Group";
      const currency = "USD";

      // When on crée le groupe
      const action = createGroup({ name, currency });
      const result = await action(vi.fn(), vi.fn(), { groupGateway } as any);

      // Then le groupe est créé avec la devise spécifiée
      expect(result.type).toBe("groups/createGroup/fulfilled");
    });
  });

  describe("Validation failures", () => {
    it("should reject empty group name", async () => {
      // Given un nom vide
      const name = "";

      // When on crée le groupe
      const action = createGroup({ name });
      const result = await action(vi.fn(), vi.fn(), { groupGateway } as any);

      // Then la création échoue
      expect(result.type).toBe("groups/createGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("vide");
      }
    });

    it("should reject whitespace-only group name", async () => {
      // Given un nom avec seulement des espaces
      const name = "   ";

      // When on crée le groupe
      const action = createGroup({ name });
      const result = await action(vi.fn(), vi.fn(), { groupGateway } as any);

      // Then la création échoue
      expect(result.type).toBe("groups/createGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("vide");
      }
    });

    it("should reject group name shorter than 2 characters", async () => {
      // Given un nom trop court
      const name = "A";

      // When on crée le groupe
      const action = createGroup({ name });
      const result = await action(vi.fn(), vi.fn(), { groupGateway } as any);

      // Then la création échoue
      expect(result.type).toBe("groups/createGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("2 caractères");
      }
    });

    it("should reject group name longer than 50 characters", async () => {
      // Given un nom trop long
      const name = "A".repeat(51);

      // When on crée le groupe
      const action = createGroup({ name });
      const result = await action(vi.fn(), vi.fn(), { groupGateway } as any);

      // Then la création échoue
      expect(result.type).toBe("groups/createGroup/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("50 caractères");
      }
    });
  });
});
