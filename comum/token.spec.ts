import { expect, it } from "vitest";
import { gerarToken } from "./token";

it("US6 FR-007 FR-008 NFR-005 37 tokens diferentes de 22 caracteres e 128 bits", () => {
  const tokens = Array.from({ length: 37 }, () => gerarToken());
  expect(new Set(tokens).size).toBe(37);
  for (const token of tokens) {
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    // 22 caracteres base64url = 132 bits de espaço; os 16 bytes de origem = 128 bits.
    const bytes = Buffer.from(token, "base64url");
    expect(bytes).toHaveLength(16);
  }
});
