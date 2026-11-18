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
    // O gate da 3.2 acha cada teste citado pelo arquivo (atributo file) e pelo nome sem describe.
    reporters: ["default", ["junit", { addFileAttribute: true }]],
    outputFile: { junit: ".aidlc-junit.xml" },
    testTimeout: 30_000,
    // Os testes de regras compartilham o mesmo emulador; rodam em sequência.
    fileParallelism: false,
  },
});
