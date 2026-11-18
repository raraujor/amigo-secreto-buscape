import { expect, it, vi } from "vitest";
import { COLECOES, fazerBackup } from "./backup";

it("backup lê todas as coleções com paginação, grava arquivos e recusa senha por argumento", async () => {
  const gravados = new Map<string, string>();
  const listar = vi.fn(async (colecao: string, _t: string, pagina?: string) =>
    colecao === "links"
      ? pagina
        ? { documents: [{ name: "l3" }] }
        : { documents: [{ name: "l1" }, { name: "l2" }], nextPageToken: "p2" }
      : colecao === "participantes"
        ? { documents: [{ name: "a" }] }
        : {},
  );
  const respostas = ["org@exemplo.test", "senha-qualquer"];
  const base = {
    perguntar: async () => respostas.shift() ?? "",
    entrar: vi.fn(async () => "token-1"),
    listar,
    gravar: async (arquivo: string, conteudo: string) => void gravados.set(arquivo, conteudo),
    imprimir: () => undefined,
    agora: () => new Date("2026-11-18T12:00:00Z"),
  };

  await expect(fazerBackup({ ...base, argv: ["--senha", "x"] })).rejects.toThrow("SENHA_POR_ARGUMENTO");
  expect(base.entrar).not.toHaveBeenCalled();

  const contagens = await fazerBackup({ ...base, argv: ["saida-teste"] });
  expect(contagens).toEqual({ participantes: 1, sorteios: 0, links: 3, mensagens: 0, config: 0 });
  const pasta = "saida-teste/2026-11-18T12-00-00-000Z";
  for (const c of COLECOES) expect(gravados.has(`${pasta}/${c}.json`)).toBe(true);
  expect(JSON.parse(gravados.get(`${pasta}/links.json`) as string)).toHaveLength(3);
  expect(JSON.parse(gravados.get(`${pasta}/resumo.json`) as string).documentos.links).toBe(3);
  expect(listar).toHaveBeenCalledWith("links", "token-1", "p2");
});
