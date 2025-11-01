/**
 * Component-Specific Constants
 *
 * Dimensions, sizes, and other magic numbers specific to individual components.
 * Extracted to avoid duplication and improve maintainability.
 */

// =============================================================================
// EXPENSE MANAGER
// =============================================================================

export const EXPENSE_MANAGER = {
  // Action button dimensions (for icon buttons)
  ACTION_BUTTON_SIZE: 36,
  ACTION_BUTTON_RADIUS: 18,

  // Colors
  ACTION_BUTTON_BG_LIGHT: "#f3f4f6",
  ACTION_BUTTON_BG_DARK: "#fee2e2",
  ACTION_BUTTON_COLOR_DISABLED: "#d1d5db",
} as const;

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

export const BUTTON_COMPONENT = {
  PRESS_SCALE: 0.98,
} as const;

// =============================================================================
// SPLASH SCREEN
// =============================================================================

export const SPLASH_SCREEN_COMPONENT = {
  ICON_BORDER_RADIUS: 40,
  LOGO_FONT_SIZE: 32,
  TITLE_FONT_SIZE: 40,
  MARGIN_TOP: 16,
  SUCCESS_COLOR: "#16a34a",
} as const;

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

export const ERROR_BOUNDARY_COMPONENT = {
  EMOJI_FONT_SIZE: 64,
  SHADOW_OPACITY: 0.1,
  SHADOW_OFFSET: { width: 0, height: 2 },
  BUTTON_BG: "#3b82f6",
  BUTTON_PADDING_HORIZONTAL: 32,
  BUTTON_PADDING_VERTICAL: 12,
  BUTTON_BORDER_RADIUS: 8,
  BUTTON_MIN_WIDTH: 120,
} as const;

// =============================================================================
// HOME SCREEN
// =============================================================================

export const HOME_SCREEN = {
  PULSE_INPUT_RANGE: [0, 1],
  PULSE_OUTPUT_RANGE: [0.3, 0.7],
} as const;

// =============================================================================
// PROFILE SCREEN
// =============================================================================

export const PROFILE_SCREEN = {
  // Add any profile-specific constants here
} as const;

// =============================================================================
// ONBOARDING
// =============================================================================

export const ONBOARDING = {
  PROGRESS_BAR_HEIGHT: 4,
  STEP_INDICATOR_SIZE: 24,
} as const;
