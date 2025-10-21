/**
 * Feature: Verify OTP code
 * En tant qu'utilisateur,
 * Je veux vérifier le code OTP que j'ai reçu,
 * Afin de m'authentifier dans l'application.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAuthGateway } from "../../infra/InMemoryAuthGateway";
import type { AuthGateway } from "../../ports/AuthGateway";
import { verifyOtp } from "./verifyOtp.usecase";

describe("Feature: Verify OTP code", () => {
  let authGateway: AuthGateway;

  beforeEach(() => {
    authGateway = new InMemoryAuthGateway();
  });

  describe("Success scenarios", () => {
    it("should verify valid OTP and create session", async () => {
      // Given un email et un code OTP valides
      const email = "user@example.com";
      const token = "123456";

      // When on vérifie le code OTP
      const action = verifyOtp({ email, token });
      const result = await action(
        vi.fn(),
        vi.fn(() => ({ auth: {} }) as any),
        { authGateway } as any,
      );

      // Then la vérification réussit
      expect(result.type).toBe("auth/verifyOtp/fulfilled");
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
        const action = verifyOtp({ email, token });
        const result = await action(
          vi.fn(),
          vi.fn(() => ({ auth: {} }) as any),
          { authGateway } as any,
        );

        // Then la vérification réussit
        expect(result.type).toBe("auth/verifyOtp/fulfilled");
      }
    });
  });
});
