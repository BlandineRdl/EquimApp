// Configuration des tests - setup global
import { vi } from "vitest";

// Define __DEV__ global for test environment
// @ts-expect-error - __DEV__ global for React Native
global.__DEV__ = true;

// Mock react-native-url-polyfill pour éviter l'erreur d'import React Native
vi.mock("react-native-url-polyfill/auto", () => ({}));

// Mock de react-native-toast-message
vi.mock("react-native-toast-message", () => ({
  default: {
    show: vi.fn(),
    hide: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  show: vi.fn(),
  hide: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
