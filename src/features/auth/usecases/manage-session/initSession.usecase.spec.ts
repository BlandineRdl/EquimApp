/**
 * Feature: Initialize session
 * En tant qu'application,
 * Je veux restaurer la session au démarrage,
 * Afin de garder l'utilisateur connecté entre les lancements.
 */

import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import { initSession } from "./initSession.usecase";

describe("Feature: Initialize session", () => {
  let store: ReduxStore;
  let authGateway: InMemoryAuthGateway;

  beforeEach(() => {
    authGateway = new InMemoryAuthGateway();
    store = initReduxStore({ authGateway });
  });

  describe("Success scenarios", () => {
    it("should return null when no session exists", async () => {
      // Given aucune session n'existe
      // (authGateway est vide)

      // When on initialise la session
      await store.dispatch(initSession());

      // Then null est retourné
      const state = store.getState();
      expect(state.auth.session).toBeNull();
      expect(state.auth.user).toBeNull();
      expect(state.auth.userId).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.hydrated).toBe(true);
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
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
      await store.dispatch(initSession());

      // Then la session est restaurée
      const state = store.getState();
      expect(state.auth.session).toEqual(mockSession);
      expect(state.auth.user).toEqual(mockSession.user);
      expect(state.auth.userId).toBe("user-123");
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.hydrated).toBe(true);
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });
  });
});
