// Configuration des tests - setup global
import { vi } from "vitest";

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
