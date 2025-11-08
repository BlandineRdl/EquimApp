import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import { deleteAccount } from "./deleteAccount.usecase";

describe("Feature: Delete account", () => {
  let store: ReduxStore;
  let authGateway: InMemoryAuthGateway;

  beforeEach(() => {
    authGateway = new InMemoryAuthGateway();
    store = initReduxStore({ authGateway });
  });

  describe("Success scenarios", () => {
    it("should delete account successfully", async () => {
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

      await store.dispatch(deleteAccount());

      const state = store.getState();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.user).toBeNull();
      expect(state.auth.userId).toBeNull();
      expect(state.auth.session).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.profileDeleted).toBe(true);
      expect(state.auth.error).toBeNull();

      const currentSession = await authGateway.getSession();
      expect(currentSession).toBeNull();
    });

    it("should clear all session data", async () => {
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

      await store.dispatch(deleteAccount());

      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.userId).toBeNull();
      expect(state.auth.session).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
      expect(state.auth.profileDeleted).toBe(true);

      const session = await authGateway.getSession();
      expect(session).toBeNull();
    });
  });
});
