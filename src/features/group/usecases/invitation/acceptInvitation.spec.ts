/**
 * Behavioral tests for Accept Invitation Use Case
 * Using DSL for readability and maintainability
 */

import { describe, it, beforeEach } from "vitest";
import { AcceptInvitationDSL } from "./acceptInvitation.dsl";

describe("Accept Invitation Use Case", () => {
  let dsl: AcceptInvitationDSL;

  beforeEach(() => {
    dsl = new AcceptInvitationDSL();
  });

  describe("Success scenarios", () => {
    it("should accept invitation with valid token and member data", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenValidMemberData("Alice", 2500)
        .whenAcceptingInvitation();

      result
        .thenShouldSucceed()
        .thenMemberShouldBeAddedToGroup()
        .thenInvitationShouldBeConsumed();
    });

    it("should trim whitespace from pseudo", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenValidMemberData("  Bob  ", 3000)
        .whenAcceptingInvitation();

      result.thenShouldSucceed();
    });

    it("should accept invitation with minimum valid income", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenValidMemberData("Charlie", 1)
        .whenAcceptingInvitation();

      result.thenShouldSucceed();
    });

    it("should accept invitation with high income", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenValidMemberData("Diana", 100000)
        .whenAcceptingInvitation();

      result.thenShouldSucceed();
    });
  });

  describe("Validation failures - Token", () => {
    it("should reject empty token", async () => {
      const result = await dsl
        .givenInvalidToken("")
        .givenValidMemberData("Eve", 2000)
        .whenAcceptingInvitation();

      result.thenShouldFailWithError("invalide");
    });

    it("should reject whitespace-only token", async () => {
      const result = await dsl
        .givenInvalidToken("   ")
        .givenValidMemberData("Frank", 2000)
        .whenAcceptingInvitation();

      result.thenShouldFailWithError("invalide");
    });

    it("should reject invalid token format", async () => {
      const result = await dsl
        .givenInvalidToken("invalid-token-123")
        .givenValidMemberData("Grace", 2000)
        .whenAcceptingInvitation();

      result.thenShouldFailWithError("invalide");
    });
  });

  describe("Validation failures - Pseudo", () => {
    it("should reject empty pseudo", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenInvalidPseudo("")
        .whenAcceptingInvitation();

      result.thenShouldFailWithError("pseudo ne peut pas être vide");
    });

    it("should reject whitespace-only pseudo", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenInvalidPseudo("   ")
        .whenAcceptingInvitation();

      result.thenShouldFailWithError("pseudo ne peut pas être vide");
    });

    it("should reject pseudo shorter than minimum length", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenInvalidPseudo("A")
        .whenAcceptingInvitation();

      result.thenShouldFailWithError("au moins 2 caractères");
    });
  });

  describe("Validation failures - Income", () => {
    it("should reject zero income", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenInvalidIncome(0)
        .whenAcceptingInvitation();

      result.thenShouldFailWithError("revenu mensuel doit être positif");
    });

    it("should reject negative income", async () => {
      const result = await dsl
        .givenAnInvitationExists()
        .givenInvalidIncome(-1000)
        .whenAcceptingInvitation();

      result.thenShouldFailWithError("revenu mensuel doit être positif");
    });
  });
});
