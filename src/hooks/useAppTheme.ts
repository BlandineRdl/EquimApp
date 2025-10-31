import { useColorScheme } from "react-native";
import { useTheme } from "tamagui";

export function useAppTheme() {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  return {
    theme,
    colorScheme: colorScheme || "light",
    isDark: colorScheme === "dark",
    isLight: colorScheme === "light",
  };
}
