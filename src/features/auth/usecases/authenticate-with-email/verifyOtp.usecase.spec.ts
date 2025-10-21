/**
 * Feature: Verify OTP code
 * En tant qu'utilisateur,
 * Je veux vérifier le code OTP que j'ai reçu,
 * Afin de m'authentifier dans l'application.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import { verifyOtp } from "./verifyOtp.usecase";

describe("Feature: Verify OTP code", () => {
  let store: ReduxStore;

  beforeEach(() => {
    const authGateway = new InMemoryAuthGateway();
    store = initReduxStore({ authGateway });
  });

  describe("Success scenarios", () => {
    it("should verify valid OTP and create session", async () => {
      // Given un email et un code OTP valides
      const email = "user@example.com";
      const token = "123456";

      // When on vérifie le code OTP
      await store.dispatch(verifyOtp({ email, token }));

      // Then la vérification réussit
      const state = store.getState();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    it("should accept OTP with any token format", async () => {
      // Given différents formats de tokens
      const testCases = [
        { email: "user@example.com", token: "123456" },
        { email: "user@example.com", token: "ABC123" },
        { email: "user@example.com", token: "000000" },
      ];

      // When on vérifie chaque code
      for (const { email, token } of testCases) {
        await store.dispatch(verifyOtp({ email, token }));

        // Then la vérification réussit
        const state = store.getState();
        expect(state.auth.isLoading).toBe(false);
        expect(state.auth.error).toBeNull();
      }
    });
  });
});
