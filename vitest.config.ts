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
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/*",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
