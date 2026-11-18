import { expect, it } from "vitest";
import { resultadoEmTexto } from "./resultado";

it("o resultado em texto tem um cabeçalho e uma linha por par, separados por tabulação, para colar numa planilha", () => {
  const texto = resultadoEmTexto([
    { participante: "Ana", amigo: "Bruno" },
    { participante: "Bruno", amigo: "Carla" },
    { participante: "Carla", amigo: "Ana" },
  ]);
  expect(texto).toBe("Quem\tTirou\nAna\tBruno\nBruno\tCarla\nCarla\tAna");
  expect(texto.split("\n")).toHaveLength(4);
});

it("o resultado em texto de um sorteio vazio é só o cabeçalho", () => {
  expect(resultadoEmTexto([])).toBe("Quem\tTirou");
});

it("o resultado em texto mantém acentos e nomes compostos como estão", () => {
  expect(resultadoEmTexto([{ participante: "João Lúcio", amigo: "Maria Rafaella" }])).toBe(
    "Quem\tTirou\nJoão Lúcio\tMaria Rafaella",
  );
});
