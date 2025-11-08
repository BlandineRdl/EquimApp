import { colors } from "../theme/colors";

export const EXPENSE_MANAGER = {
  ACTION_BUTTON_SIZE: 36,
  ACTION_BUTTON_RADIUS: 18,

  ACTION_BUTTON_BG_LIGHT: colors.gray[100],
  ACTION_BUTTON_BG_DARK: colors.error[100],
  ACTION_BUTTON_COLOR_DISABLED: colors.gray[300],
} as const;

export const BUTTON_COMPONENT = {
  PRESS_SCALE: 0.98,
} as const;

export const SPLASH_SCREEN_COMPONENT = {
  ICON_BORDER_RADIUS: 40,
  LOGO_FONT_SIZE: 32,
  TITLE_FONT_SIZE: 40,
  MARGIN_TOP: 16,
  SUCCESS_COLOR: colors.success[600],
} as const;

export const ERROR_BOUNDARY_COMPONENT = {
  EMOJI_FONT_SIZE: 64,
  SHADOW_OPACITY: 0.1,
  SHADOW_OFFSET: { width: 0, height: 2 },
  BUTTON_BG: colors.primary[500],
  BUTTON_PADDING_HORIZONTAL: 32,
  BUTTON_PADDING_VERTICAL: 12,
  BUTTON_BORDER_RADIUS: 8,
  BUTTON_MIN_WIDTH: 120,
} as const;

export const HOME_SCREEN = {
  PULSE_INPUT_RANGE: [0, 1],
  PULSE_OUTPUT_RANGE: [0.3, 0.7],
} as const;

export const PROFILE_SCREEN = {} as const;

export const ONBOARDING = {
  PROGRESS_BAR_HEIGHT: 4,
  STEP_INDICATOR_SIZE: 24,
} as const;
