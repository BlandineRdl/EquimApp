import { describe, expect, it } from "vitest";
import { IncomeValidationService } from "./incomeValidation.service";
import { MAX_INCOME, MIN_INCOME } from "./user.constants";

describe("IncomeValidationService", () => {
  describe("validateIncome", () => {
    it("should accept valid income at minimum boundary", () => {
      const result = IncomeValidationService.validateIncome(MIN_INCOME);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept valid income in normal range", () => {
      const result = IncomeValidationService.validateIncome(1000);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept valid income at maximum boundary", () => {
      const result = IncomeValidationService.validateIncome(MAX_INCOME);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject income below minimum (zero)", () => {
      const result = IncomeValidationService.validateIncome(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Le revenu mensuel doit être au moins ${MIN_INCOME}€`,
      );
    });

    it("should reject negative income", () => {
      const result = IncomeValidationService.validateIncome(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Le revenu mensuel doit être au moins ${MIN_INCOME}€`,
      );
    });

    it("should reject income above maximum", () => {
      const result = IncomeValidationService.validateIncome(1000000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Le revenu mensuel doit être inférieur à ${MAX_INCOME.toLocaleString("fr-FR")}€`,
      );
    });

    it("should reject NaN values", () => {
      const result = IncomeValidationService.validateIncome(Number.NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Le revenu doit être un nombre valide");
    });
  });
});
