import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/lib/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
        "src/actions/**/*.{ts,tsx}",
      ],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/*",
        "**/index.ts", // barrel exports
        "src/lib/db.ts", // database singleton
        "src/lib/auth/index.ts", // auth exports
        "src/lib/stripe/client.ts", // stripe singleton
        "src/lib/stripe/index.ts", // barrel exports
        "src/lib/email/types.ts", // type definitions only
        "src/lib/stripe/types.ts", // type definitions only
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "#content": resolve(__dirname, "./tests/__mocks__/content"),
    },
  },
});
