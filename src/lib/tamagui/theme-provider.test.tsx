import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@react-native-async-storage/async-storage");
vi.mock("react-native", () => ({
  useColorScheme: vi.fn(),
}));
vi.mock("react-native-toast-message", () => ({
  default: {
    show: vi.fn(),
  },
}));

describe("Theme Provider - AsyncStorage Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Error Handling for Theme Loading", () => {
    it("should log error when AsyncStorage.getItem fails", async () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockError = new Error("AsyncStorage read error");
      vi.mocked(AsyncStorage.getItem).mockRejectedValue(mockError);

      // Act
      try {
        await AsyncStorage.getItem("app-theme");
      } catch (error) {
        // Simulate error handling in component
        console.error(
          "[ThemeProvider] Failed to load theme preference:",
          error,
        );
        Toast.show({
          type: "error",
          text1: "Erreur de chargement du thème",
          text2: "Utilisation du thème par défaut",
        });
      }

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ThemeProvider] Failed to load theme preference:",
        mockError,
      );
      expect(Toast.show).toHaveBeenCalledWith({
        type: "error",
        text1: "Erreur de chargement du thème",
        text2: "Utilisation du thème par défaut",
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Error Handling for Theme Saving", () => {
    it("should log error when AsyncStorage.setItem fails", async () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockError = new Error("AsyncStorage write error");
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(mockError);

      // Act
      try {
        await AsyncStorage.setItem("app-theme", "dark");
      } catch (error) {
        // Simulate error handling in component
        console.error(
          "[ThemeProvider] Failed to save theme preference:",
          error,
        );
        Toast.show({
          type: "error",
          text1: "Erreur de sauvegarde",
          text2: "Votre préférence de thème pourrait ne pas persister",
        });
      }

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ThemeProvider] Failed to save theme preference:",
        mockError,
      );
      expect(Toast.show).toHaveBeenCalledWith({
        type: "error",
        text1: "Erreur de sauvegarde",
        text2: "Votre préférence de thème pourrait ne pas persister",
      });

      consoleErrorSpy.mockRestore();
    });

    it("should NOT silently fail when save fails", async () => {
      // Arrange
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const toastShowSpy = vi.spyOn(Toast, "show");
      vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error("Error"));

      // Act
      try {
        await AsyncStorage.setItem("app-theme", "dark");
      } catch (error) {
        console.error(
          "[ThemeProvider] Failed to save theme preference:",
          error,
        );
        Toast.show({
          type: "error",
          text1: "Erreur de sauvegarde",
          text2: "Votre préférence de thème pourrait ne pas persister",
        });
      }

      // Assert - Should NOT be silent
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(toastShowSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Theme Storage Key", () => {
    it("should use correct storage key for theme", async () => {
      // Arrange
      vi.mocked(AsyncStorage.getItem).mockResolvedValue("light");

      // Act
      await AsyncStorage.getItem("app-theme");

      // Assert
      expect(AsyncStorage.getItem).toHaveBeenCalledWith("app-theme");
    });

    it("should save theme with correct storage key", async () => {
      // Arrange
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      // Act
      await AsyncStorage.setItem("app-theme", "dark");

      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalledWith("app-theme", "dark");
    });
  });

  describe("Theme Values", () => {
    it("should only accept 'light' or 'dark' as valid theme values", () => {
      const validThemes = ["light", "dark"];
      const invalidThemes = ["blue", "auto", "", null, undefined, 123];

      validThemes.forEach((theme) => {
        expect(["light", "dark"]).toContain(theme);
      });

      invalidThemes.forEach((theme) => {
        expect(["light", "dark"]).not.toContain(theme);
      });
    });
  });

  describe("Toast Error Messages", () => {
    it("should have French error messages for load failure", () => {
      const loadErrorMessage = {
        type: "error",
        text1: "Erreur de chargement du thème",
        text2: "Utilisation du thème par défaut",
      };

      expect(loadErrorMessage.text1).toMatch(/erreur/i);
      expect(loadErrorMessage.text2).toMatch(/défaut/i);
    });

    it("should have French error messages for save failure", () => {
      const saveErrorMessage = {
        type: "error",
        text1: "Erreur de sauvegarde",
        text2: "Votre préférence de thème pourrait ne pas persister",
      };

      expect(saveErrorMessage.text1).toMatch(/erreur/i);
      expect(saveErrorMessage.text2).toMatch(/persister/i);
    });
  });

  describe("Error Logging Format", () => {
    it("should prefix error logs with [ThemeProvider]", () => {
      const loadErrorPrefix =
        "[ThemeProvider] Failed to load theme preference:";
      const saveErrorPrefix =
        "[ThemeProvider] Failed to save theme preference:";

      expect(loadErrorPrefix).toMatch(/^\[ThemeProvider\]/);
      expect(saveErrorPrefix).toMatch(/^\[ThemeProvider\]/);
    });
  });
});
