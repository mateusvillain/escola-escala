import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    // e2e/ tem seus próprios specs Playwright (test:e2e) — sem isso, o Vitest
    // tenta carregá-los e quebra (test() do Playwright não roda fora dele).
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
