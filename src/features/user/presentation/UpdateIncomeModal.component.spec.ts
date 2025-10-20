import { describe, expect, it } from "vitest";
import { validateIncome } from "../domain/incomeValidation.service";

describe("UpdateIncomeModal validation logic", () => {
  it("should validate income correctly", () => {
    // Valid cases
    expect(validateIncome(1).isValid).toBe(true);
    expect(validateIncome(2500).isValid).toBe(true);
    expect(validateIncome(999999).isValid).toBe(true);

    // Invalid cases
    expect(validateIncome(0).isValid).toBe(false);
    expect(validateIncome(-100).isValid).toBe(false);
    expect(validateIncome(1000000).isValid).toBe(false);
    expect(validateIncome(Number.NaN).isValid).toBe(false);
  });

  it("should provide appropriate error messages", () => {
    const tooLowResult = validateIncome(0);
    expect(tooLowResult.errors.length).toBeGreaterThan(0);
    expect(tooLowResult.errors[0]).toContain("au moins 1€");

    const tooHighResult = validateIncome(1000000);
    expect(tooHighResult.errors.length).toBeGreaterThan(0);
    expect(tooHighResult.errors[0]).toContain("inférieur");

    const nanResult = validateIncome(Number.NaN);
    expect(nanResult.errors.length).toBeGreaterThan(0);
    expect(nanResult.errors[0]).toContain("nombre valide");
  });
});
