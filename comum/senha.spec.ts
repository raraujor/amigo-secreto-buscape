import { expect, it } from "vitest";
import { senhaForte } from "./senha";

it("US1 NFR-007 recusa senha com menos de 12 caracteres ou sem letra, número e símbolo", () => {
  expect(senhaForte("Abc123!@#xyz")).toBe(true);
  expect(senhaForte("Natal-2026-família")).toBe(true);
  expect(senhaForte("Abc123!@#xy")).toBe(false); // 11 caracteres
  expect(senhaForte("abcdefghijk!")).toBe(false); // sem número
  expect(senhaForte("123456789012!")).toBe(false); // sem letra
  expect(senhaForte("abcdefgh1234")).toBe(false); // sem símbolo
});
