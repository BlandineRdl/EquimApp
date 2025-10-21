/**
 * Feature: Initialize session
 * En tant qu'application,
 * Je veux restaurer la session au démarrage,
 * Afin de garder l'utilisateur connecté entre les lancements.
 */

import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import type { AuthGateway } from "../../ports/AuthGateway";
import { initSession } from "./initSession.usecase";

describe("Feature: Initialize session", () => {
  let authGateway: InMemoryAuthGateway;

  beforeEach(() => {
    authGateway = new InMemoryAuthGateway();
  });

  describe("Success scenarios", () => {
    it("should return null when no session exists", async () => {
      // Given aucune session n'existe
      // (authGateway est vide)

      // When on initialise la session
      const action = initSession();
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then null est retourné
      expect(result.type).toBe("auth/initSession/fulfilled");
      expect(result.payload).toBeNull();
    });

    it("should restore existing session", async () => {
      // Given une session existe
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

      // When on initialise la session
      const action = initSession();
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la session est restaurée
      expect(result.type).toBe("auth/initSession/fulfilled");
      if ("payload" in result) {
        const session = result.payload as Session;
        expect(session).toEqual(mockSession);
        expect(session.user.id).toBe("user-123");
        expect(session.user.email).toBe("user@example.com");
      }
    });
  });
});
