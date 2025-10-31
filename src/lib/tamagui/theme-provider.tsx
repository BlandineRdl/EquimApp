import { useColorScheme } from "react-native";
import { TamaguiProvider as BaseTamaguiProvider } from "tamagui";
import config from "../../../tamagui.config";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function TamaguiProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();

  return (
    <BaseTamaguiProvider config={config} defaultTheme={colorScheme || "light"}>
      {children}
    </BaseTamaguiProvider>
  );
}
