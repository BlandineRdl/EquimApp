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
      const result = await dsl
        .givenAGroupExists()
        .givenMemberData("Marc", 2500)
        .whenAddingPhantomMember();

      result.thenPhantomMemberShouldHaveCorrectShare();
    });

    it("should allow adding multiple phantom members", async () => {
      // Setup group
      await dsl.givenAGroupExists();

      // Add first phantom member
      const result1 = await dsl
        .givenMemberData("Lisa", 1500)
        .whenAddingPhantomMember();

      result1.thenShouldSucceed();

      // Add second phantom member
      const result2 = await dsl
        .givenMemberData("Marc", 2500)
        .whenAddingPhantomMember();

      result2
        .thenShouldSucceed()
        .thenSharesShouldBeRecalculated();

      // Should have 3 members total (current user + 2 phantoms)
      const result = dsl.getResult();
      if (result && result.shares.shares.length !== 3) {
        throw new Error(
          `Expected 3 members, got ${result.shares.shares.length}`
        );
      }
    });

    it("should trim whitespace from pseudo", async () => {
      const result = await dsl
        .givenAGroupExists()
        .givenMemberData("  Sophie  ", 1800)
        .whenAddingPhantomMember();

      result.thenShouldSucceed();

      const resultData = dsl.getResult();
      if (!resultData) {
        throw new Error("Expected result");
      }

      const phantomMember = resultData.shares.shares.find(
        (s) => s.pseudo === "Sophie"
      );

      if (!phantomMember) {
        throw new Error("Expected phantom member with trimmed pseudo");
      }
    });
  });

  describe("Validation failures", () => {
    it("should reject empty pseudo", async () => {
      const result = await dsl
        .givenAGroupExists()
        .givenInvalidPseudo("")
        .whenAddingPhantomMember();

      result.thenShouldFailWithError("Le pseudo ne peut pas être vide");
    });

    it("should reject pseudo with only whitespace", async () => {
      const result = await dsl
        .givenAGroupExists()
        .givenInvalidPseudo("   ")
        .whenAddingPhantomMember();

      result.thenShouldFailWithError("Le pseudo ne peut pas être vide");
    });

    it("should reject pseudo shorter than 2 characters", async () => {
      const result = await dsl
        .givenAGroupExists()
        .givenInvalidPseudo("A")
        .whenAddingPhantomMember();

      result.thenShouldFailWithError("au moins 2 caractères");
    });

    it("should reject zero income", async () => {
      const result = await dsl
        .givenAGroupExists()
        .givenInvalidIncome(0)
        .whenAddingPhantomMember();

      result.thenShouldFailWithError("doit être positif");
    });

    it("should reject negative income", async () => {
      const result = await dsl
        .givenAGroupExists()
        .givenInvalidIncome(-1000)
        .whenAddingPhantomMember();

      result.thenShouldFailWithError("doit être positif");
    });
  });

  describe("Business rules", () => {
    it("should calculate shares proportionally to income", async () => {
      await dsl.givenAGroupExists();

      // Add phantom with same income as current user (should be ~50/50)
      const result = await dsl
        .givenMemberData("Lisa", 1000)
        .whenAddingPhantomMember();

      result.thenShouldSucceed();

      const resultData = dsl.getResult();
      if (!resultData) {
        throw new Error("Expected result");
      }

      const lisaShare = resultData.shares.shares.find(
        (s) => s.pseudo === "Lisa"
      );

      if (!lisaShare) {
        throw new Error("Lisa not found in shares");
      }

      // Lisa should have around 50% (allowing some margin for rounding)
      if (lisaShare.sharePercentage < 45 || lisaShare.sharePercentage > 55) {
        throw new Error(
          `Expected ~50% share, got ${lisaShare.sharePercentage}%`
        );
      }
    });

    it("should include phantom member in group expenses calculation", async () => {
      const result = await dsl
        .givenAGroupExists()
        .givenMemberData("Marc", 3000)
        .whenAddingPhantomMember();

      result.thenShouldSucceed();

      const resultData = dsl.getResult();
      if (!resultData) {
        throw new Error("Expected result");
      }

      // Shares should be calculated including the phantom member
      if (resultData.shares.totalExpenses === undefined) {
        throw new Error("Expected totalExpenses to be calculated");
      }
    });
  });
});
