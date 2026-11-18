import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lerCsv } from "./csv";

const fixture = readFileSync("testes/fixtures/familia-37.csv", "utf8");

describe("lerCsv", () => {
  it("US2 FR-001 lê as 37 linhas da fixture com nome, whatsapp e responsavel", () => {
    const linhas = lerCsv(fixture);
    expect(linhas).toHaveLength(37);
    expect(linhas[0]).toEqual({ nome: "Aurora Teste", whatsapp: "5500910002000", responsavel: null });
    expect(linhas[29]).toEqual({
      nome: "Dora Simulada",
      whatsapp: "5500910022002",
      responsavel: "Cecília Exemplo",
    });
    expect(linhas[36].responsavel).toBe("Avó Fictícia");
  });

  it("US2 FR-001 aceita ponto e vírgula, BOM, CRLF, aspas e cabeçalho Responsável", () => {
    const texto =
      "﻿Nome;WhatsApp;Responsável\r\n" +
      '"Silva; Ana";(00) 91111-0000;\r\n' +
      'João Teste;"00 92222-0000";"Silva; Ana"\r\n' +
      "\r\n";
    expect(lerCsv(texto)).toEqual([
      { nome: "Silva; Ana", whatsapp: "5500911110000", responsavel: null },
      { nome: "João Teste", whatsapp: "5500922220000", responsavel: "Silva; Ana" },
    ]);
  });

  it("US2 FR-001 mantém a ordem da planilha", () => {
    const nomes = lerCsv(fixture).map((l) => l.nome);
    expect(nomes.slice(0, 3)).toEqual(["Aurora Teste", "Bento Ficticio", "Cecília Exemplo"]);
    expect(nomes.at(-1)).toBe("Lino Exemplo");
  });

  it("US2 FR-002 aceita o mesmo número em três linhas", () => {
    const doNumero = lerCsv(fixture).filter((l) => l.whatsapp === "5500910022002");
    expect(doNumero.map((l) => l.nome)).toEqual([
      "Cecília Exemplo",
      "Dora Simulada",
      "Jade Inventada",
      "Lino Exemplo",
    ]);
  });

  it("US2 FR-001 fixture vira 37 linhas com nome, número e responsável para a tela", () => {
    const linhas = lerCsv(fixture);
    expect(linhas.every((l) => l.nome && /^55\d{10,11}$/.test(l.whatsapp))).toBe(true);
    expect(linhas.filter((l) => l.responsavel !== null)).toHaveLength(3);
  });

  it("rejeita planilha sem as colunas nome e whatsapp", () => {
    expect(() => lerCsv("pessoa,telefone\nAna,123\n")).toThrow("CABECALHO");
  });
});
