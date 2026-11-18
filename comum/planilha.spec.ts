import { expect, it } from "vitest";
import { lerCsv } from "./csv";
import { analisarPlanilha, decodificarCsv, prepararImportacao } from "./planilha";

const analisar = (csv: string) => analisarPlanilha(lerCsv(csv));
const bytes = (texto: string, codificacao: "utf8" | "latin1") => new Uint8Array(Buffer.from(texto, codificacao));

it("US2 FR-001 aceita (34) 99999-0000, +55 34 99999-0000 e 3432100000 e aponta 349999000 como inválido", () => {
  const csv = [
    "nome,whatsapp",
    "A,(34) 99999-0000",
    "B,+55 34 99999-0000",
    "C,3432100000",
    "D,349999000",
  ].join("\n");
  expect(analisar(csv).erros).toEqual(["Linha 5: o número de D é inválido (349999000)."]);
});

it("US2 FR-001 número com zero à esquerda é aceito, e números com mais de 13 dígitos ou em notação científica são apontados como inválidos", () => {
  const csv = [
    "nome,whatsapp",
    '"A","034 99999-0000"',
    '"B","5534999990000123"',
    '"C","3,4E+10"',
  ].join("\n");
  expect(analisar(csv).erros).toEqual([
    "Linha 3: o número de B é inválido (5534999990000123).",
    "Linha 4: o número de C é inválido (3410).",
  ]);
});

it("US2 FR-001 o número aceito fica guardado como 55 mais DDD e número, só com dígitos", () => {
  const linhas = lerCsv("nome,whatsapp\nA,(34) 99999-0000\nB,+55 34 99999-0000\nC,3432100000\nD,034 99999-0000\n");
  expect(linhas.map((l) => l.whatsapp)).toEqual(["5534999990000", "5534999990000", "553432100000", "5534999990000"]);
});

it("US2 FR-001 linha sem nome, linha sem número e dois Ana barram a importação com a linha apontada", () => {
  const csv = ["nome,whatsapp", ",34999990000", "Bia,", "Ana,34999990001", "Ana,34999990002"].join("\n");
  expect(analisar(csv).erros).toEqual([
    "Linha 2: falta o nome.",
    "Linha 3: falta o número de WhatsApp.",
    "Nome repetido: Ana (linhas 4 e 5).",
  ]);
});

it("US2 FR-001 nome repetido ignora maiúsculas e espaços extras, e José e Jose são nomes diferentes", () => {
  const csv = ["nome,whatsapp", "Ana,34999990001", "  ana  ,34999990002", "José,34999990003", "Jose,34999990004"].join("\n");
  expect(analisar(csv).erros).toEqual(["Nome repetido: Ana (linhas 2 e 3)."]);
});

it("US2 FR-001 lista com mais de 80 pessoas é barrada com o limite", () => {
  const pessoas = (n: number) =>
    ["nome,whatsapp", ...Array.from({ length: n }, (_, i) => `Pessoa ${i + 1},34999${String(i).padStart(6, "0")}`)].join("\n");
  expect(analisar(pessoas(80)).erros).toEqual([]);
  expect(analisar(pessoas(81)).erros).toEqual(["A lista tem 81 pessoas; o limite é 80."]);
});

it("US2 FR-001 CSV do Excel em Windows-1252 e CSV em UTF-8 mostram João e Conceição com os acentos certos", () => {
  const texto = "nome;whatsapp\nJoão;34999990000\nConceição;34999990001\n";
  const doExcel = decodificarCsv(bytes(texto, "latin1"));
  const utf8 = decodificarCsv(bytes(texto, "utf8"));
  expect(doExcel).toBe(texto);
  expect(utf8).toBe(texto);
  expect(lerCsv(doExcel).map((l) => l.nome)).toEqual(["João", "Conceição"]);
});

it("US2 FR-001 FR-002 Maria e os filhos João e Laura no mesmo número são aceitos e o responsável fica registrado", () => {
  const csv = ["nome,whatsapp,responsavel", "Maria,34999990000,", "João,34999990000,Maria", "Laura,34999990000,Maria"].join("\n");
  const linhas = lerCsv(csv);
  expect(analisarPlanilha(linhas)).toEqual({ erros: [], avisos: [] });
  expect(linhas.map((l) => l.responsavel)).toEqual([null, "Maria", "Maria"]);
});

it("US2 FR-001 responsável que não está na lista é aceito", () => {
  const csv = ["nome,whatsapp,responsavel", "Luís,34999990000,Pedro"].join("\n");
  expect(analisar(csv)).toEqual({ erros: [], avisos: [] });
});

it("US2 FR-002 mesmo número em duas linhas sem responsável vira aviso com as duas linhas, sem barrar", () => {
  const csv = ["nome,whatsapp", "Ana,34999990000", "Bia,34999990000"].join("\n");
  expect(analisar(csv)).toEqual({
    erros: [],
    avisos: ["Linhas 2 e 3: Ana e Bia usam o mesmo número e nenhuma tem responsável; a mensagem não dirá de quem é o link."],
  });
});

it("US2 FR-002 três linhas sem responsável no mesmo número viram um aviso com as três linhas", () => {
  const csv = ["nome,whatsapp", "Ana,34999990000", "Bia,34999990000", "Caio,34999990000"].join("\n");
  expect(analisar(csv).avisos).toEqual([
    "Linhas 2, 3 e 4: Ana, Bia e Caio usam o mesmo número e nenhuma tem responsável; a mensagem não dirá de quem é o link.",
  ]);
});

it("US2 FR-002 mãe sem responsável e filhos com responsável no mesmo número não geram aviso", () => {
  const csv = ["nome,whatsapp,responsavel", "Maria,34999990000,", "João,34999990000,Maria"].join("\n");
  expect(analisar(csv).avisos).toEqual([]);
});

it("US2 FR-001 CSV com ponto e vírgula salvo pelo Excel em Windows-1252 devolve as linhas com os acentos certos, de ponta a ponta", () => {
  const texto = "nome;whatsapp;responsavel\nJoão;(34) 99999-0000;\nConceição;(34) 99999-0001;\n";
  const resultado = prepararImportacao(bytes(texto, "latin1"));
  expect(resultado.erros).toEqual([]);
  expect(resultado.linhas.map((l) => l.nome)).toEqual(["João", "Conceição"]);
  expect(resultado.linhas[0].whatsapp).toBe("5534999990000");
});

it("US2 FR-001 planilha com erro não devolve linhas para importar", () => {
  const texto = "nome,whatsapp\nAna,34999990000\nBia,123\n";
  const resultado = prepararImportacao(bytes(texto, "utf8"));
  expect(resultado.erros).toEqual(["Linha 3: o número de Bia é inválido (123)."]);
  expect(resultado.linhas).toEqual([]);
});

it("US2 FR-001 planilha sem as colunas nome e whatsapp devolve o erro de colunas", () => {
  const resultado = prepararImportacao(bytes("pessoa,telefone\nAna,123\n", "utf8"));
  expect(resultado.erros).toEqual(["A planilha precisa ter as colunas nome e whatsapp (e, se houver, responsavel)."]);
  expect(resultado.linhas).toEqual([]);
});

it("US2 FR-001 planilha sem nenhuma pessoa é barrada para não apagar a lista", () => {
  const resultado = prepararImportacao(bytes("nome,whatsapp\n", "utf8"));
  expect(resultado.erros).toEqual(["A planilha não tem nenhuma pessoa."]);
  expect(resultado.linhas).toEqual([]);
});
