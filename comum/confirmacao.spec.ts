import { expect, it } from "vitest";
import { confirmouRecomecar } from "./confirmacao";

it("US4 FR-004 só a palavra RECOMEÇAR, em qualquer caixa e com espaços nas pontas, confirma recomeçar do zero", () => {
  expect(confirmouRecomecar("RECOMEÇAR")).toBe(true);
  expect(confirmouRecomecar("recomeçar")).toBe(true);
  expect(confirmouRecomecar("  Recomecar  ")).toBe(true);
  expect(confirmouRecomecar("")).toBe(false);
  expect(confirmouRecomecar("recomeçar tudo")).toBe(false);
  expect(confirmouRecomecar("sim")).toBe(false);
  expect(confirmouRecomecar("recome")).toBe(false);
});
