/**
 * Theme Constants
 *
 * Centralized theme-related constants to avoid magic values and duplication.
 * These constants are used across the application for consistent styling.
 */

// =============================================================================
// COLORS
// =============================================================================

/**
 * Light theme colors
 */
export const LIGHT_THEME_COLORS = {
  // Backgrounds
  BACKGROUND: "#ffffff",
  BACKGROUND_SECONDARY: "#f9fafb",
  BACKGROUND_TERTIARY: "#f3f4f6",

  // Text
  TEXT: "#111827",
  TEXT_SECONDARY: "#374151",
  TEXT_TERTIARY: "#6b7280",

  // Borders
  BORDER: "#e5e7eb",
  BORDER_HOVER: "#d1d5db",
} as const;

/**
 * Dark theme colors
 */
export const DARK_THEME_COLORS = {
  // Backgrounds
  BACKGROUND: "#111827",
  BACKGROUND_SECONDARY: "#1f2937",
  BACKGROUND_TERTIARY: "#374151",

  // Text
  TEXT: "#ffffff",
  TEXT_SECONDARY: "#9ca3af",
  TEXT_TERTIARY: "#6b7280",

  // Borders
  BORDER: "#374151",
  BORDER_HOVER: "#4b5563",
} as const;

/**
 * Semantic colors (theme-independent)
 */
export const SEMANTIC_COLORS = {
  // Success
  SUCCESS: "#16a34a", // success600
  SUCCESS_LIGHT: "#22c55e", // success500
  SUCCESS_DARK: "#15803d", // success700

  // Error
  ERROR: "#ef4444", // error500
  ERROR_LIGHT: "#f87171", // error400
  ERROR_DARK: "#dc2626", // error600

  // Warning
  WARNING: "#f59e0b", // warning500
  WARNING_DARK: "#d97706", // warning600

  // Primary
  PRIMARY: "#0ea5e9", // primary500
  PRIMARY_HOVER: "#0284c7", // primary600
  PRIMARY_PRESS: "#0369a1", // primary700

  // Gray shades (common)
  GRAY_100: "#f3f4f6",
  GRAY_200: "#e5e7eb",
  GRAY_300: "#d1d5db",
  GRAY_400: "#9ca3af",
  GRAY_500: "#6b7280",
  GRAY_600: "#4b5563",
  GRAY_700: "#374151",
  GRAY_800: "#1f2937",
  GRAY_900: "#111827",
} as const;

// =============================================================================
// COLOR HELPERS
// =============================================================================

export type ThemeMode = "light" | "dark";

/**
 * Get background color for SafeAreaView based on theme
 */
export const getSafeAreaBackgroundColor = (theme: ThemeMode): string =>
  theme === "light"
    ? LIGHT_THEME_COLORS.BACKGROUND
    : DARK_THEME_COLORS.BACKGROUND;

/**
 * Get text color based on theme
 */
export const getTextColor = (theme: ThemeMode): string =>
  theme === "light" ? LIGHT_THEME_COLORS.TEXT : DARK_THEME_COLORS.TEXT;

/**
 * Get secondary text color based on theme
 */
export const getTextColorSecondary = (theme: ThemeMode): string =>
  theme === "light"
    ? LIGHT_THEME_COLORS.TEXT_SECONDARY
    : DARK_THEME_COLORS.TEXT_SECONDARY;

/**
 * Get tertiary text color based on theme
 */
export const getTextColorTertiary = (theme: ThemeMode): string =>
  theme === "light"
    ? LIGHT_THEME_COLORS.TEXT_TERTIARY
    : DARK_THEME_COLORS.TEXT_TERTIARY;

// =============================================================================
// DIMENSIONS
// =============================================================================

/**
 * Button dimensions and styling
 */
export const BUTTON = {
  // Scale on press
  PRESS_SCALE: 0.98,

  // Border radius
  BORDER_RADIUS: 8,

  // Padding
  PADDING_HORIZONTAL: 32,
  PADDING_VERTICAL: 12,

  // Min width
  MIN_WIDTH: 120,
} as const;

/**
 * Icon button dimensions
 */
export const ICON_BUTTON = {
  SIZE: 36,
  RADIUS: 18, // Half of SIZE for circular buttons
} as const;

/**
 * Splash screen dimensions
 */
export const SPLASH_SCREEN = {
  ICON_BORDER_RADIUS: 40,
  LOGO_SIZE: 32,
  TITLE_SIZE: 40,
  MARGIN_TOP: 16,
} as const;

/**
 * Error boundary dimensions
 */
export const ERROR_BOUNDARY = {
  EMOJI_SIZE: 64,
  SHADOW_OPACITY: 0.1,
  SHADOW_OFFSET_WIDTH: 0,
  SHADOW_OFFSET_HEIGHT: 2,
} as const;

/**
 * Common spacing values
 */
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  BASE: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
  XXXL: 40,
  XXXXL: 48,
} as const;

/**
 * Common border radius values
 */
export const BORDER_RADIUS = {
  NONE: 0,
  SM: 4,
  BASE: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  FULL: 9999,
} as const;

// =============================================================================
// OPACITY VALUES
// =============================================================================

export const OPACITY = {
  DISABLED: 0.5,
  SUBTLE: 0.7,
  SHADOW: 0.1,
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const Z_INDEX = {
  MODAL: 1000,
  TOAST: 2000,
  DROPDOWN: 100,
  HEADER: 10,
  OVERLAY: 500,
} as const;

// =============================================================================
// ANIMATION DURATIONS (in milliseconds)
// =============================================================================

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;
