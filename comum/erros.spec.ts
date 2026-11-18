import { expect, it } from "vitest";
import { mensagemDeErro } from "./erros";

it("US4 FR-004 mensagem do sorteio recusado diz que os links já saíram e a de menos de dois participantes", () => {
  expect(mensagemDeErro("ENVIO_INICIADO", "sortear")).toBe("Os links já saíram, então não dá para sortear de novo.");
  expect(mensagemDeErro("MINIMO_DOIS")).toBe("São precisos ao menos 2 participantes para sortear.");
});

it("US2 FR-001 mensagem da importação recusada diz que os links já saíram", () => {
  expect(mensagemDeErro("ENVIO_INICIADO", "importar")).toBe("Os links já saíram, então não dá para importar outra lista.");
});

it("US4 FR-004 conferência que não pôde ser feita tem mensagem própria e erro desconhecido não repete nomes", () => {
  expect(mensagemDeErro("ENVIO_INDEFINIDO")).toBe("Não foi possível conferir se os links já saíram. Tente de novo.");
  const desconhecido = mensagemDeErro("Missing or insufficient permissions para Ana Teste (34) 99999-0000");
  expect(desconhecido).toBe("Não foi possível concluir. Tente de novo.");
  expect(desconhecido).not.toContain("Ana");
});

it("US8 FR-010 mensagem de erro de sorteio que mudou pede para recarregar a página", () => {
  expect(mensagemDeErro("SORTEIO_MUDOU")).toBe("O sorteio mudou. Recarregue a página e tente de novo.");
});

it("US1 FR-001 as mensagens do limite da lista dizem 20 itens e a linha de 200 caracteres", () => {
  expect(mensagemDeErro("LISTA_ITENS_DEMAIS")).toBe("O limite é de 20 itens por pessoa.");
  expect(mensagemDeErro("LISTA_ITEM_LONGO", "sortear", 3)).toBe("A linha 3 passa de 200 caracteres.");
});
