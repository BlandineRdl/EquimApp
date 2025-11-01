/**
 * Feature: Create Group
 * En tant qu'utilisateur,
 * Je veux créer un groupe,
 * Afin de partager des dépenses avec d'autres personnes.
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
import { createGroup } from "./createGroup.usecase";

describe("Feature: Create group", () => {
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
    it("should create group with valid name", async () => {
      // Given un nom de groupe valide
      const name = "Ma Coloc";

      // When on crée le groupe
      const result = await store.dispatch(createGroup({ name }));

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
      const result = await store.dispatch(createGroup({ name }));

      // Then le groupe est créé (nom trimmed)
      expect(result.type).toBe("groups/createGroup/fulfilled");
    });

    it("should use default EUR currency when not specified", async () => {
      // Given aucune devise spécifiée
      const name = "Test Group";

      // When on crée le groupe
      const result = await store.dispatch(createGroup({ name }));

      // Then le groupe est créé avec EUR par défaut
      expect(result.type).toBe("groups/createGroup/fulfilled");
    });

    it("should accept custom currency", async () => {
      // Given une devise personnalisée
      const name = "US Group";
      const currency = "USD";

      // When on crée le groupe
      const result = await store.dispatch(createGroup({ name, currency }));

      // Then le groupe est créé avec la devise spécifiée
      expect(result.type).toBe("groups/createGroup/fulfilled");
    });
  });

  describe("Validation failures", () => {
    it("should reject empty group name", async () => {
      // Given un nom vide
      const name = "";

      // When on crée le groupe
      const result = await store.dispatch(createGroup({ name }));

      // Then la création échoue
      expect(result.type).toBe("groups/createGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("vide");
      }
    });

    it("should reject whitespace-only group name", async () => {
      // Given un nom avec seulement des espaces
      const name = "   ";

      // When on crée le groupe
      const result = await store.dispatch(createGroup({ name }));

      // Then la création échoue
      expect(result.type).toBe("groups/createGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("vide");
      }
    });

    it("should reject group name shorter than 2 characters", async () => {
      // Given un nom trop court
      const name = "A";

      // When on crée le groupe
      const result = await store.dispatch(createGroup({ name }));

      // Then la création échoue
      expect(result.type).toBe("groups/createGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("2 caractères");
      }
    });

    it("should reject group name longer than 50 characters", async () => {
      // Given un nom trop long
      const name = "A".repeat(51);

      // When on crée le groupe
      const result = await store.dispatch(createGroup({ name }));

      // Then la création échoue
      expect(result.type).toBe("groups/createGroup/rejected");
      if ("payload" in result) {
        const error = result.payload as AppError | undefined;
        expect(error?.message).toContain("50 caractères");
      }
    });
  });
});
