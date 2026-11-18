import { expect, it } from "vitest";
import { estadoDaSugestao } from "./sugestao";

it("US5 FR-005 a lista aparece na ordem escrita", () => {
  const estado = estadoDaSugestao({ nome: "Bruno", itens: ["Camisa tamanho M", "Livro da coleção Clássicos"], falhou: false });
  expect(estado).toEqual({ tipo: "lista", itens: ["Camisa tamanho M", "Livro da coleção Clássicos"] });
});

it("US6 FR-006 sem lista mostra o aviso com o nome do amigo", () => {
  expect(estadoDaSugestao({ nome: "Bruno", itens: null, falhou: false })).toEqual({
    tipo: "aviso",
    texto: "A sugestão de presente de Bruno ainda não está disponível. Volte depois.",
  });
});

it("US6 FR-006 itens vazios mostram o aviso", () => {
  expect(estadoDaSugestao({ nome: "Bruno", itens: [], falhou: false }).tipo).toBe("aviso");
});

it("US7 FR-008 falha de leitura mostra a mensagem de falha e não o aviso", () => {
  const estado = estadoDaSugestao({ nome: "Bruno", itens: null, falhou: true });
  expect(estado).toEqual({
    tipo: "falha",
    texto: "Não foi possível carregar a sugestão agora. Recarregue a página para tentar de novo.",
  });
  expect(JSON.stringify(estado)).not.toContain("ainda não está disponível");
});
