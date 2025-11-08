import { vi } from "vitest";

// @ts-expect-error - __DEV__ global for React Native
global.__DEV__ = true;

vi.mock("react-native-url-polyfill/auto", () => ({}));

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {},
    manifest: {},
  },
}));

vi.mock("../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

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
