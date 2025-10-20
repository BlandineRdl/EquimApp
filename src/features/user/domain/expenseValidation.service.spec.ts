import { describe, expect, it } from "vitest";
import {
  ExpenseValidationError,
  validateExpense,
  validateExpenseAmount,
  validateExpenseLabel,
} from "./expenseValidation.service";

describe("expenseValidation.service", () => {
  describe("validateExpenseAmount", () => {
    it("should accept valid amount", () => {
      expect(() => validateExpenseAmount(100)).not.toThrow();
    });

    it("should reject invalid amount", () => {
      expect(() => validateExpenseAmount(0)).toThrow(ExpenseValidationError);
      expect(() => validateExpenseAmount(1000000)).toThrow(
        ExpenseValidationError,
      );
      expect(() => validateExpenseAmount(Number.NaN)).toThrow(
        ExpenseValidationError,
      );
    });
  });

  describe("validateExpenseLabel", () => {
    it("should accept valid label", () => {
      expect(() => validateExpenseLabel("Rent")).not.toThrow();
    });

    it("should reject invalid label", () => {
      expect(() => validateExpenseLabel("")).toThrow(ExpenseValidationError);
      expect(() => validateExpenseLabel("a".repeat(51))).toThrow(
        ExpenseValidationError,
      );
    });
  });

  describe("validateExpense", () => {
    it("should accept valid expense", () => {
      expect(() => validateExpense("Rent", 800)).not.toThrow();
    });

    it("should reject invalid expense", () => {
      expect(() => validateExpense("", 100)).toThrow(ExpenseValidationError);
      expect(() => validateExpense("Rent", 0)).toThrow(ExpenseValidationError);
    });
  });
});
