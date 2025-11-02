import { describe, expect, it } from "vitest";
import {
  getExpenseColorByIndex,
  getExpenseColorPalette,
} from "../expenseColors.utils";

describe("expenseColors.utils", () => {
  describe("getExpenseColorPalette", () => {
    it("should return an array of 20 colors", () => {
      const palette = getExpenseColorPalette();

      expect(palette).toHaveLength(20);
      expect(palette.every((color) => typeof color === "string")).toBe(true);
      expect(palette.every((color) => color.startsWith("#"))).toBe(true);
    });

    it("should return consistent colors", () => {
      const palette1 = getExpenseColorPalette();
      const palette2 = getExpenseColorPalette();

      expect(palette1).toEqual(palette2);
    });
  });

  describe("getExpenseColorByIndex", () => {
    it("should return the correct color for index 0", () => {
      const color = getExpenseColorByIndex(0);

      expect(color).toBe("#0ea5e9"); // Blue
    });

    it("should return the correct color for index 1", () => {
      const color = getExpenseColorByIndex(1);

      expect(color).toBe("#22c55e"); // Green
    });

    it("should cycle through colors when index exceeds palette length", () => {
      const firstColor = getExpenseColorByIndex(0);
      const cycleLater = getExpenseColorByIndex(20); // Should wrap to index 0

      expect(cycleLater).toBe(firstColor);
    });

    it("should handle large indices by cycling", () => {
      const color40 = getExpenseColorByIndex(40);
      const color0 = getExpenseColorByIndex(0);

      expect(color40).toBe(color0); // 40 % 20 = 0
    });

    it("should return different colors for consecutive indices", () => {
      const color0 = getExpenseColorByIndex(0);
      const color1 = getExpenseColorByIndex(1);
      const color2 = getExpenseColorByIndex(2);

      expect(color0).not.toBe(color1);
      expect(color1).not.toBe(color2);
      expect(color0).not.toBe(color2);
    });

    it("should support up to 20 distinct colors before cycling", () => {
      const colors = new Set();

      for (let i = 0; i < 20; i++) {
        colors.add(getExpenseColorByIndex(i));
      }

      expect(colors.size).toBe(20);
    });
  });
});
