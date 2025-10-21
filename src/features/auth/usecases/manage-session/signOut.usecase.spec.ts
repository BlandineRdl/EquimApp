/**
 * Feature: Sign out
 * En tant qu'utilisateur connecté,
 * Je veux me déconnecter,
 * Afin de sécuriser mon compte.
 */

import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import type { AuthGateway } from "../../ports/AuthGateway";
import { signOut } from "./signOut.usecase";

describe("Feature: Sign out", () => {
  let authGateway: InMemoryAuthGateway;

  beforeEach(() => {
    authGateway = new InMemoryAuthGateway();
  });

  describe("Success scenarios", () => {
    it("should sign out successfully", async () => {
      // Given un utilisateur connecté
      const mockSession: Session = {
        access_token: "mock-token",
        refresh_token: "mock-refresh",
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: "bearer",
        user: {
          id: "user-123",
          email: "user@example.com",
          aud: "authenticated",
          role: "authenticated",
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      };

      authGateway.setCurrentSession(mockSession);

      // When on se déconnecte
      const action = signOut();
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la déconnexion réussit
      expect(result.type).toBe("auth/signOut/fulfilled");

      // And la session est supprimée
      const currentSession = await authGateway.getSession();
      expect(currentSession).toBeNull();
    });

    it("should work even when no session exists", async () => {
      // Given aucune session n'existe
      // (authGateway est vide)

      // When on se déconnecte
      const action = signOut();
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la déconnexion réussit quand même
      expect(result.type).toBe("auth/signOut/fulfilled");
    });
  });
});
