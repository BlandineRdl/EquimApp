import { describe, expect, it } from "vitest";
import { IncomeValidationService } from "../domain/incomeValidation.service";

describe("UpdateIncomeModal validation logic", () => {
  it("should validate income correctly", () => {
    // Valid cases
    expect(IncomeValidationService.validateIncome(1).isValid).toBe(true);
    expect(IncomeValidationService.validateIncome(2500).isValid).toBe(true);
    expect(IncomeValidationService.validateIncome(999999).isValid).toBe(true);

    // Invalid cases
    expect(IncomeValidationService.validateIncome(0).isValid).toBe(false);
    expect(IncomeValidationService.validateIncome(-100).isValid).toBe(false);
    expect(IncomeValidationService.validateIncome(1000000).isValid).toBe(false);
    expect(IncomeValidationService.validateIncome(Number.NaN).isValid).toBe(
      false,
    );
  });

  it("should provide appropriate error messages", () => {
    const tooLowResult = IncomeValidationService.validateIncome(0);
    expect(tooLowResult.errors.length).toBeGreaterThan(0);
    expect(tooLowResult.errors[0]).toContain("au moins 1€");

    const tooHighResult = IncomeValidationService.validateIncome(1000000);
    expect(tooHighResult.errors.length).toBeGreaterThan(0);
    expect(tooHighResult.errors[0]).toContain("inférieur");

    const nanResult = IncomeValidationService.validateIncome(Number.NaN);
    expect(nanResult.errors.length).toBeGreaterThan(0);
    expect(nanResult.errors[0]).toContain("nombre valide");
  });
});
