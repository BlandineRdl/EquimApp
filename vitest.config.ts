import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // @ts-expect-error - Vite 7 plugin type incompatibility with @vitejs/plugin-react
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    // Load .env.test for integration tests
    env: {
      SKIP_INTEGRATION_TESTS: process.env.SKIP_INTEGRATION_TESTS || "false",
    },
    // Organize tests by type
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    // Exclude node_modules and build artifacts
    exclude: ["node_modules", "dist", ".expo", "ios", "android", "aidd"],
  },
  resolve: {
    alias: {
      // Prevent Vite from trying to process React Native's Flow-based files
      "react-native": "react-native-web",
    },
  },
  optimizeDeps: {
    exclude: ["react-native"],
  },
});
