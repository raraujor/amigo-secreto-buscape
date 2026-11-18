import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "comum/**/*.spec.ts",
      "scripts/**/*.spec.ts",
      "testes/regras/*.spec.ts",
      "testes/repo/*.spec.ts",
    ],
    environment: "node",
    testTimeout: 30_000,
    // Os testes de regras compartilham o mesmo emulador; rodam em sequência.
    fileParallelism: false,
  },
});
