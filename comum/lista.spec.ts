import { expect, it } from "vitest";
import { chaveDaLista, lerLista, resumoDeListas, textoDaLista, textoDeTodasAsListas } from "./lista";

const linha = (n: number, caractere = "a") => caractere.repeat(n);

it("US1 FR-001 duas linhas viram dois itens na ordem escrita e um endereço é texto comum", () => {
  expect(lerLista("Camisa tamanho M\nLivro da coleção Clássicos")).toEqual({
    ok: true,
    itens: ["Camisa tamanho M", "Livro da coleção Clássicos"],
  });
  expect(lerLista("Livro https://loja.exemplo.test/livro")).toEqual({
    ok: true,
    itens: ["Livro https://loja.exemplo.test/livro"],
  });
});

it("US1 FR-001 linhas em branco e CRLF são ignorados e os espaços das pontas saem", () => {
  expect(lerLista("  Camisa  \r\n\r\n   \r\nLivro\r\n")).toEqual({ ok: true, itens: ["Camisa", "Livro"] });
  expect(lerLista("")).toEqual({ ok: true, itens: [] });
  expect(lerLista(" \n \n")).toEqual({ ok: true, itens: [] });
});

it("US1 FR-001 20 itens de 200 caracteres são aceitos", () => {
  const texto = Array.from({ length: 20 }, () => linha(200)).join("\n");
  const resultado = lerLista(texto);
  expect(resultado.ok).toBe(true);
  if (resultado.ok) expect(resultado.itens).toHaveLength(20);
});

it("US1 FR-001 21 itens são recusados com LISTA_ITENS_DEMAIS", () => {
  const texto = Array.from({ length: 21 }, (_, i) => `item ${i}`).join("\n");
  expect(lerLista(texto)).toEqual({ ok: false, codigo: "LISTA_ITENS_DEMAIS" });
});

it("US1 FR-001 item de 201 caracteres é recusado com o número da linha digitada", () => {
  expect(lerLista(`Camisa\n${linha(201)}`)).toEqual({ ok: false, codigo: "LISTA_ITEM_LONGO", linha: 2 });
});

it("US1 FR-001 o número da linha conta as linhas em branco", () => {
  expect(lerLista(`Camisa\n\n\n${linha(201)}`)).toEqual({ ok: false, codigo: "LISTA_ITEM_LONGO", linha: 4 });
});

it("US1 FR-001 21 itens e item longo ao mesmo tempo mostram LISTA_ITENS_DEMAIS primeiro", () => {
  const itens = Array.from({ length: 20 }, (_, i) => `item ${i}`);
  itens.push(linha(201));
  expect(lerLista(itens.join("\n"))).toEqual({ ok: false, codigo: "LISTA_ITENS_DEMAIS" });
});

it("US1 FR-001 acento e emoji contam como 1 caractere", () => {
  expect(lerLista(linha(200, "é")).ok).toBe(true);
  expect(lerLista(linha(200, "🎁")).ok).toBe(true);
  expect(lerLista(linha(201, "🎁"))).toEqual({ ok: false, codigo: "LISTA_ITEM_LONGO", linha: 1 });
  const decomposto = "é".repeat(200);
  expect(lerLista(decomposto).ok).toBe(true);
});

it("US4 FR-004 maiúsculas e espaços extras dão a mesma chave e acento diferente não", () => {
  expect(chaveDaLista("  BRUNO   Silva ")).toBe(chaveDaLista("bruno silva"));
  expect(chaveDaLista("Brúno")).not.toBe(chaveDaLista("Bruno"));
});

it("US4 FR-004 nome composto e decomposto dão a mesma chave", () => {
  expect(chaveDaLista("José")).toBe(chaveDaLista("José"));
});

it("US4 FR-004 nome com barra, ponto ou sublinhados vira chave válida de documento", () => {
  for (const nome of ["Ana/Maria", ".", "..", "__x__", "a b"]) {
    const chave = chaveDaLista(nome);
    expect(chave.startsWith("n_")).toBe(true);
    expect(chave).not.toContain("/");
    expect(chave).not.toMatch(/^__.*__$/);
  }
});

it("US2 FR-002 a caixa de edição mostra a lista atual sem linhas em branco", () => {
  expect(textoDaLista(["Camisa", "Livro"])).toBe("Camisa\nLivro");
  expect(textoDaLista([])).toBe("");
});

const participantes = Array.from({ length: 36 }, (_, i) => ({ nome: `Pessoa ${i + 1}` }));

it("US3 FR-003 3 com lista e 33 sem lista entre 36 participantes", () => {
  const listas = new Set([chaveDaLista("Pessoa 1"), chaveDaLista("pessoa  2"), chaveDaLista("PESSOA 36")]);
  const resumo = resumoDeListas(participantes, listas);
  expect(resumo).toHaveLength(36);
  expect(resumo.filter((p) => p.comLista)).toHaveLength(3);
  expect(resumo.filter((p) => !p.comLista)).toHaveLength(33);
});

it("US3 FR-003 lista de nome fora da planilha não entra no indicador", () => {
  const listas = new Set([chaveDaLista("Pessoa 1"), chaveDaLista("Alguém que saiu")]);
  const resumo = resumoDeListas(participantes, listas);
  expect(resumo).toHaveLength(36);
  expect(resumo.filter((p) => p.comLista).map((p) => p.nome)).toEqual(["Pessoa 1"]);
});

// ---- Exportar lista de presentes (intenção 261120): texto para o WhatsApp ----

const listasSalvas = (pares: [string, string[]][]) => new Map(pares.map(([nome, itens]) => [chaveDaLista(nome), itens]));

it("US1 FR-001 uma lista vira título e itens numerados", () => {
  const texto = textoDeTodasAsListas(
    [{ nome: "Ana" }],
    listasSalvas([["Ana", ["Camisa tamanho M", "Livro da coleção Clássicos"]]]),
  );
  expect(texto).toBe("Lista de presentes de Ana:\n1. Camisa tamanho M\n2. Livro da coleção Clássicos");
});

it("US1 FR-001 só quem tem lista entra, na ordem da planilha, separado por linha em branco", () => {
  const texto = textoDeTodasAsListas(
    [{ nome: "Carla" }, { nome: "Bruno" }, { nome: "Ana" }],
    listasSalvas([
      ["Ana", ["Camisa"]],
      ["Carla", ["Livro", "Meia"]],
    ]),
  );
  expect(texto).toBe("Lista de presentes de Carla:\n1. Livro\n2. Meia\n\nLista de presentes de Ana:\n1. Camisa");
  expect(texto).not.toContain("Bruno");
});

it("US1 FR-001 nome com outra caixa ou espaços extras acha a mesma lista", () => {
  const texto = textoDeTodasAsListas([{ nome: "Ana  Maria" }], listasSalvas([["ana maria", ["Camisa"]]]));
  expect(texto).toBe("Lista de presentes de Ana  Maria:\n1. Camisa");
});

it("US1 FR-001 lista de nome fora da planilha e lista vazia ficam de fora", () => {
  const texto = textoDeTodasAsListas(
    [{ nome: "Ana" }, { nome: "Bruno" }],
    listasSalvas([
      ["Alguém que saiu", ["Camisa"]],
      ["Bruno", []],
    ]),
  );
  expect(texto).toBe("");
});

it("US1 FR-001 sem nenhuma lista o texto é vazio, e o botão fica desabilitado", () => {
  expect(textoDeTodasAsListas([{ nome: "Ana" }], new Map())).toBe("");
});

it("US1 NFR-001 copiar não altera as listas lidas", () => {
  const listas = listasSalvas([["Ana", ["Camisa"]]]);
  const antes = JSON.stringify([...listas]);
  textoDeTodasAsListas([{ nome: "Ana" }], listas);
  expect(JSON.stringify([...listas])).toBe(antes);
});
