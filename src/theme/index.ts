/**
 * Theme system for consistent styling across the application
 * Import this file to access all theme tokens
 */

export * from "./colors";
export * from "./spacing";
export * from "./typography";

import { colors } from "./colors";
import { spacing } from "./spacing";
import { fontSize, fontWeight, lineHeight } from "./typography";

export const theme = {
  colors,
  spacing,
  fontSize,
  fontWeight,
  lineHeight,

  // Common border radius values
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  // Common shadow values
  shadow: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;
