/**
 * Behavioral tests for Add Phantom Member Use Case
 * Using DSL for readability and maintainability
 */

import { describe, it, beforeEach } from "vitest";
import { AddMemberDSL } from "./addMember.dsl";

describe("Add Phantom Member Use Case", () => {
  let dsl: AddMemberDSL;

  beforeEach(() => {
    dsl = new AddMemberDSL();
  });

  describe("Success scenarios", () => {
    it("should add a phantom member to a group", async () => {
      const result = await dsl
        .givenAGroupExists()
        .givenMemberData("Lisa", 1500)
        .whenAddingPhantomMember();

      result
        .thenShouldSucceed()
        .thenPhantomMemberShouldBeAdded()
        .thenSharesShouldBeRecalculated();
    });

    it("should calculate correct shares for phantom member", async () => {
      await dsl
        .givenAGroupExists()
        .givenMemberData("Marc", 2500)
        .whenAddingPhantomMember()
        .thenPhantomMemberShouldHaveCorrectShare();
    });

    it("should allow adding multiple phantom members", async () => {
      await dsl.givenAGroupExists();

      // Add first phantom member
      await dsl
        .givenMemberData("Lisa", 1500)
        .whenAddingPhantomMember()
        .thenShouldSucceed();

      // Add second phantom member
      await dsl
        .givenMemberData("Marc", 2500)
        .whenAddingPhantomMember()
        .thenShouldSucceed()
        .thenSharesShouldBeRecalculated();

      // Should have 3 members total (current user + 2 phantoms)
      const result = dsl.getResult();
      if (result.shares.shares.length !== 3) {
        throw new Error(
          `Expected 3 members, got ${result.shares.shares.length}`,
        );
      }
    });

    it("should trim whitespace from pseudo", async () => {
      await dsl
        .givenAGroupExists()
        .givenMemberData("  Sophie  ", 1800)
        .whenAddingPhantomMember()
        .thenShouldSucceed();

      const result = dsl.getResult();
      const phantomMember = result.shares.shares.find(
        (s: any) => s.pseudo === "Sophie",
      );

      if (!phantomMember) {
        throw new Error("Expected phantom member with trimmed pseudo");
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject empty pseudo", async () => {
      await dsl
        .givenAGroupExists()
        .givenInvalidPseudo("")
        .whenAddingPhantomMember()
        .thenShouldFailWithError("Le pseudo ne peut pas être vide");
    });

    it("should reject pseudo with only whitespace", async () => {
      await dsl
        .givenAGroupExists()
        .givenInvalidPseudo("   ")
        .whenAddingPhantomMember()
        .thenShouldFailWithError("Le pseudo ne peut pas être vide");
    });

    it("should reject pseudo shorter than 2 characters", async () => {
      await dsl
        .givenAGroupExists()
        .givenInvalidPseudo("A")
        .whenAddingPhantomMember()
        .thenShouldFailWithError("au moins 2 caractères");
    });

    it("should reject zero income", async () => {
      await dsl
        .givenAGroupExists()
        .givenInvalidIncome(0)
        .whenAddingPhantomMember()
        .thenShouldFailWithError("doit être positif");
    });

    it("should reject negative income", async () => {
      await dsl
        .givenAGroupExists()
        .givenInvalidIncome(-1000)
        .whenAddingPhantomMember()
        .thenShouldFailWithError("doit être positif");
    });
  });

  describe("Business rules", () => {
    it("should calculate shares proportionally to income", async () => {
      await dsl.givenAGroupExists();

      // Add phantom with same income as current user (should be ~50/50)
      await dsl
        .givenMemberData("Lisa", 1000)
        .whenAddingPhantomMember()
        .thenShouldSucceed();

      const result = dsl.getResult();
      const lisaShare = result.shares.shares.find(
        (s: any) => s.pseudo === "Lisa",
      );

      // Lisa should have around 50% (allowing some margin for rounding)
      if (lisaShare.sharePercentage < 45 || lisaShare.sharePercentage > 55) {
        throw new Error(
          `Expected ~50% share, got ${lisaShare.sharePercentage}%`,
        );
      }
    });

    it("should include phantom member in group expenses calculation", async () => {
      await dsl
        .givenAGroupExists()
        .givenMemberData("Marc", 3000)
        .whenAddingPhantomMember()
        .thenShouldSucceed();

      const result = dsl.getResult();

      // Shares should be calculated including the phantom member
      if (!result.shares.totalExpenses) {
        throw new Error("Expected totalExpenses to be calculated");
      }
    });
  });
});
