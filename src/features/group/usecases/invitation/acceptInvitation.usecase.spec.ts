/**
 * Feature: Accept invitation
 * En tant qu'utilisateur invité,
 * Je veux accepter une invitation à rejoindre un groupe,
 * Afin de partager des dépenses avec ce groupe.
 */

import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../../auth/infra/InMemoryAuthGateway";
import { InMemoryUserGateway } from "../../../user/infra/InMemoryUserGateway";
import { MIN_PSEUDO_LENGTH } from "../../domain/manage-members/member.constants";
import { InMemoryGroupGateway } from "../../infra/inMemoryGroup.gateway";
import { acceptInvitation } from "./acceptInvitation.usecase";

describe("Feature: Accept invitation", () => {
  let store: ReduxStore;
  let groupGateway: InMemoryGroupGateway;
  let authGateway: InMemoryAuthGateway;
  let userGateway: InMemoryUserGateway;
  const userId = "test-user-123";

  beforeEach(() => {
    groupGateway = new InMemoryGroupGateway();
    authGateway = new InMemoryAuthGateway();
    userGateway = new InMemoryUserGateway();
    store = initReduxStore({ groupGateway, authGateway, userGateway });

    // Setup authenticated user session
    const mockSession: Session = {
      access_token: "mock-token",
      refresh_token: "mock-refresh",
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: "bearer",
      user: {
        id: userId,
        email: "user@example.com",
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };
    authGateway.setCurrentSession(mockSession);
  });

  describe("Success scenarios", () => {
    it("should accept invitation and create new profile", async () => {
      // Given une invitation valide et aucun profil existant
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      const inviteResult = await groupGateway.generateInvitation(groupId);
      const token = inviteResult.token;

      // When on accepte l'invitation
      const result = await store.dispatch(
        acceptInvitation({
          token,
          pseudo: "NewUser",
          monthlyIncome: 2000,
        }),
      );

      // Then l'acceptation réussit
      expect(result.type).toBe("groups/acceptInvitation/fulfilled");
      if ("payload" in result && result.payload) {
        const response = result.payload as { groupId: string };
        expect(response.groupId).toBeDefined();
      }

      // And le profil est créé
      const profile = await userGateway.getProfileById(userId);
      expect(profile).toBeDefined();
      expect(profile?.pseudo).toBe("NewUser");
      expect(profile?.monthlyIncome).toBe(2000);
      expect(profile?.shareRevenue).toBe(true);
    });

    it("should accept invitation and update existing profile", async () => {
      // Given un profil existant et une invitation valide
      await userGateway.createProfile({
        id: userId,
        pseudo: "OldPseudo",
        monthlyIncome: 1500,
        shareRevenue: false,
        currency: "EUR",
      });

      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      const inviteResult = await groupGateway.generateInvitation(groupId);
      const token = inviteResult.token;

      // When on accepte l'invitation avec un nouveau pseudo
      const result = await store.dispatch(
        acceptInvitation({
          token,
          pseudo: "UpdatedPseudo",
          monthlyIncome: 2500,
        }),
      );

      // Then l'acceptation réussit
      expect(result.type).toBe("groups/acceptInvitation/fulfilled");

      // And le profil est mis à jour
      const profile = await userGateway.getProfileById(userId);
      expect(profile).toBeDefined();
      expect(profile?.pseudo).toBe("UpdatedPseudo");
      expect(profile?.monthlyIncome).toBe(2500);
      expect(profile?.shareRevenue).toBe(true);
    });

    it("should trim pseudo before saving", async () => {
      // Given une invitation valide
      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      const inviteResult = await groupGateway.generateInvitation(groupId);
      const token = inviteResult.token;

      // When on accepte avec un pseudo contenant des espaces
      const result = await store.dispatch(
        acceptInvitation({
          token,
          pseudo: "  SpacedUser  ",
          monthlyIncome: 2000,
        }),
      );

      // Then le profil est créé avec le pseudo trimmed
      expect(result.type).toBe("groups/acceptInvitation/fulfilled");
      const profile = await userGateway.getProfileById(userId);
      expect(profile?.pseudo).toBe("SpacedUser");
    });

    it("should reject when user is not authenticated", async () => {
      // Given un utilisateur non authentifié
      await authGateway.signOut();

      const createResult = await groupGateway.createGroup("Test Group", "EUR");
      const groupId = createResult.groupId;
      const inviteResult = await groupGateway.generateInvitation(groupId);
      const token = inviteResult.token;

      // When on essaie d'accepter l'invitation
      const result = await store.dispatch(
        acceptInvitation({
          token,
          pseudo: "TestUser",
          monthlyIncome: 2000,
        }),
      );

      // Then l'acceptation échoue
      expect(result.type).toBe("groups/acceptInvitation/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("authentifié");
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject empty token", async () => {
      // Given un token vide
      const token = "";
      const pseudo = "TestUser";
      const monthlyIncome = 2000;

      // When on accepte l'invitation
      const result = await store.dispatch(
        acceptInvitation({ token, pseudo, monthlyIncome }),
      );

      // Then l'acceptation échoue
      expect(result.type).toBe("groups/acceptInvitation/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("invalide");
      }
    });

    it("should reject whitespace-only token", async () => {
      // Given un token avec seulement des espaces
      const token = "   ";
      const pseudo = "TestUser";
      const monthlyIncome = 2000;

      // When on accepte l'invitation
      const result = await store.dispatch(
        acceptInvitation({ token, pseudo, monthlyIncome }),
      );

      // Then l'acceptation échoue
      expect(result.type).toBe("groups/acceptInvitation/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("invalide");
      }
    });

    it("should reject empty pseudo", async () => {
      // Given un pseudo vide
      const token = "valid-token";
      const pseudo = "";
      const monthlyIncome = 2000;

      // When on accepte l'invitation
      const result = await store.dispatch(
        acceptInvitation({ token, pseudo, monthlyIncome }),
      );

      // Then l'acceptation échoue
      expect(result.type).toBe("groups/acceptInvitation/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("vide");
      }
    });

    it("should reject whitespace-only pseudo", async () => {
      // Given un pseudo avec seulement des espaces
      const token = "valid-token";
      const pseudo = "   ";
      const monthlyIncome = 2000;

      // When on accepte l'invitation
      const result = await store.dispatch(
        acceptInvitation({ token, pseudo, monthlyIncome }),
      );

      // Then l'acceptation échoue
      expect(result.type).toBe("groups/acceptInvitation/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("vide");
      }
    });

    it(`should reject pseudo shorter than ${MIN_PSEUDO_LENGTH} characters`, async () => {
      // Given un pseudo trop court
      const token = "valid-token";
      const pseudo = "A";
      const monthlyIncome = 2000;

      // When on accepte l'invitation
      const result = await store.dispatch(
        acceptInvitation({ token, pseudo, monthlyIncome }),
      );

      // Then l'acceptation échoue
      expect(result.type).toBe("groups/acceptInvitation/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain(
          `${MIN_PSEUDO_LENGTH} caractères`,
        );
      }
    });

    it("should reject zero monthly income", async () => {
      // Given un revenu de zéro
      const token = "valid-token";
      const pseudo = "TestUser";
      const monthlyIncome = 0;

      // When on accepte l'invitation
      const result = await store.dispatch(
        acceptInvitation({ token, pseudo, monthlyIncome }),
      );

      // Then l'acceptation échoue
      expect(result.type).toBe("groups/acceptInvitation/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("positif");
      }
    });

    it("should reject negative monthly income", async () => {
      // Given un revenu négatif
      const token = "valid-token";
      const pseudo = "TestUser";
      const monthlyIncome = -1000;

      // When on accepte l'invitation
      const result = await store.dispatch(
        acceptInvitation({ token, pseudo, monthlyIncome }),
      );

      // Then l'acceptation échoue
      expect(result.type).toBe("groups/acceptInvitation/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("positif");
      }
    });
  });
});
