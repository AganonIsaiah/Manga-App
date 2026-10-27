import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    clearMocks: true,
    maxWorkers: 4,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/features/**/*.{ts,tsx}", "src/hooks/**/*.ts"],
      exclude: [
        "**/*.test.*",
        "**/*-mocks.ts",
        "**/*.types.ts",
        "**/home.shared.tsx",
        "**/chatbot/**",
        "**/library/profile/{Bookmarks,Readings,Reviews}.tsx",
      ],
      thresholds: { lines: 80, statements: 80, functions: 75, branches: 70 },
    },
  },
});
