import { useTheme } from "tamagui";
import { useThemeControl } from "../lib/tamagui/theme-provider";

export function useAppTheme() {
  const tamaguiTheme = useTheme();
  const { theme } = useThemeControl();

  return {
    theme: tamaguiTheme,
    colorScheme: theme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };
}
