import { expect, it } from "vitest";
import { formatarDataHora } from "./data";

it("formata a data e a hora do sorteio no horário de Brasília", () => {
  expect(formatarDataHora(new Date("2026-11-18T03:05:00Z"))).toBe("18/11/2026 às 00:05");
  expect(formatarDataHora(new Date("2026-12-25T01:30:00Z"))).toBe("24/12/2026 às 22:30");
  expect(formatarDataHora(new Date("2026-11-28T15:00:00Z"))).toBe("28/11/2026 às 12:00");
});
