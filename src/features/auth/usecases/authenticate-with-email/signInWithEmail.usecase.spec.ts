/**
 * Feature: Sign in with email (OTP)
 * En tant qu'utilisateur,
 * Je veux me connecter avec mon email,
 * Afin de recevoir un code OTP pour m'authentifier.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import type { AuthGateway } from "../../ports/AuthGateway";
import { signInWithEmail } from "./signInWithEmail.usecase";

describe("Feature: Sign in with email", () => {
  let authGateway: AuthGateway;

  beforeEach(() => {
    authGateway = new InMemoryAuthGateway();
  });

  describe("Success scenarios", () => {
    it("should send OTP to valid email", async () => {
      // Given un email valide
      const email = "user@example.com";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then l'envoi réussit
      expect(result.type).toBe("auth/signIn/fulfilled");
    });

    it("should normalize email to lowercase", async () => {
      // Given un email avec des majuscules
      const email = "User@Example.COM";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then l'envoi réussit (email normalisé)
      expect(result.type).toBe("auth/signIn/fulfilled");
    });

    it("should trim whitespace from email", async () => {
      // Given un email avec des espaces
      const email = "  user@example.com  ";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then l'envoi réussit (email trimmed)
      expect(result.type).toBe("auth/signIn/fulfilled");
    });
  });

  describe("Validation failures", () => {
    it("should reject email without @", async () => {
      // Given un email invalide sans @
      const email = "userexample.com";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la demande échoue
      expect(result.type).toBe("auth/signIn/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("valid email");
      }
    });

    it("should reject email without domain", async () => {
      // Given un email sans domaine
      const email = "user@";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la demande échoue
      expect(result.type).toBe("auth/signIn/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("valid email");
      }
    });

    it("should reject email without local part", async () => {
      // Given un email sans partie locale
      const email = "@example.com";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la demande échoue
      expect(result.type).toBe("auth/signIn/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("valid email");
      }
    });

    it("should reject empty email", async () => {
      // Given un email vide
      const email = "";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la demande échoue
      expect(result.type).toBe("auth/signIn/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("valid email");
      }
    });

    it("should reject whitespace-only email", async () => {
      // Given un email avec seulement des espaces
      const email = "   ";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la demande échoue
      expect(result.type).toBe("auth/signIn/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("valid email");
      }
    });

    it("should reject email with spaces", async () => {
      // Given un email avec des espaces au milieu
      const email = "user name@example.com";

      // When on envoie une demande de connexion
      const action = signInWithEmail(email);
      const result = await action(vi.fn(), vi.fn(), { authGateway } as any);

      // Then la demande échoue
      expect(result.type).toBe("auth/signIn/rejected");
      if ("error" in result) {
        expect(result.error.message).toContain("valid email");
      }
    });
  });
});
