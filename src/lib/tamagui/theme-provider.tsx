import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import Toast from "react-native-toast-message";
import { TamaguiProvider as BaseTamaguiProvider } from "tamagui";
import config from "../../../tamagui.config";

const THEME_STORAGE_KEY = "app-theme";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function TamaguiProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference on mount, or use system theme if no preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((savedTheme) => {
        if (savedTheme === "light" || savedTheme === "dark") {
          // User has a saved preference, use it
          setThemeState(savedTheme);
        } else {
          // No saved preference, use system theme (first launch)
          setThemeState(systemColorScheme === "dark" ? "dark" : "light");
        }
        setIsReady(true);
      })
      .catch((error) => {
        // Log error and fallback to system theme
        console.error(
          "[ThemeProvider] Failed to load theme preference:",
          error,
        );
        Toast.show({
          type: "error",
          text1: "Erreur de chargement du thème",
          text2: "Utilisation du thème par défaut",
        });
        setThemeState(systemColorScheme === "dark" ? "dark" : "light");
        setIsReady(true);
      });
  }, [systemColorScheme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((error) => {
      // Log error and notify user that preference may not persist
      console.error("[ThemeProvider] Failed to save theme preference:", error);
      Toast.show({
        type: "error",
        text1: "Erreur de sauvegarde",
        text2: "Votre préférence de thème pourrait ne pas persister",
      });
    });
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  // Don't render until we've loaded the saved theme
  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <BaseTamaguiProvider config={config} defaultTheme={theme}>
        {children}
      </BaseTamaguiProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeControl() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeControl must be used within TamaguiProvider");
  }
  return context;
}
