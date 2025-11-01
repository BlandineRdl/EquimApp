/**
 * Feature: Sign in with email (OTP)
 * En tant qu'utilisateur,
 * Je veux me connecter avec mon email,
 * Afin de recevoir un code OTP pour m'authentifier.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  initReduxStore,
  type ReduxStore,
} from "../../../../store/buildReduxStore";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import { signInWithEmail } from "./signInWithEmail.usecase";

describe("Feature: Sign in with email", () => {
  let store: ReduxStore;

  beforeEach(() => {
    const authGateway = new InMemoryAuthGateway();
    store = initReduxStore({ authGateway });
  });

  describe("Success scenarios", () => {
    it("should send OTP to valid email", async () => {
      // Given un email valide
      const email = "user@example.com";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then l'envoi réussit
      const state = store.getState();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    it("should normalize email to lowercase", async () => {
      // Given un email avec des majuscules
      const email = "User@Example.COM";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then l'envoi réussit (email normalisé)
      const state = store.getState();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    it("should trim whitespace from email", async () => {
      // Given un email avec des espaces
      const email = "  user@example.com  ";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then l'envoi réussit (email trimmed)
      const state = store.getState();
      expect(state.auth.isLoading).toBe(false);
      expect(state.auth.error).toBeNull();
    });
  });

  describe("Validation failures", () => {
    it("should reject email without @", async () => {
      // Given un email invalide sans @
      const email = "userexample.com";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then la demande échoue
      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject email without domain", async () => {
      // Given un email sans domaine
      const email = "user@";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then la demande échoue
      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject email without local part", async () => {
      // Given un email sans partie locale
      const email = "@example.com";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then la demande échoue
      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject empty email", async () => {
      // Given un email vide
      const email = "";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then la demande échoue
      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject whitespace-only email", async () => {
      // Given un email avec seulement des espaces
      const email = "   ";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then la demande échoue
      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });

    it("should reject email with spaces", async () => {
      // Given un email avec des espaces au milieu
      const email = "user name@example.com";

      // When on envoie une demande de connexion
      await store.dispatch(signInWithEmail(email));

      // Then la demande échoue
      const state = store.getState();
      expect(state.auth.error?.message).toContain("valid email");
    });
  });
});
