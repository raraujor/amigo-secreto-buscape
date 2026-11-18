import { describe, expect, it, vi } from "vitest";
import { criarOrganizador } from "./criar-organizador";

describe("criarOrganizador", () => {
  it("US1 NFR-007 script recusa senha por argumento e valida antes de criar a conta", async () => {
    const criarConta = vi.fn(async () => "uid-123");
    const imprimir = vi.fn();

    // Senha passada por argumento: recusa sem perguntar nem criar nada.
    const perguntarNada = vi.fn(async () => "");
    await expect(
      criarOrganizador({ argv: ["--senha", "Abc123!@#xyz"], perguntar: perguntarNada, criarConta, imprimir }),
    ).rejects.toThrow("SENHA_POR_ARGUMENTO");
    expect(perguntarNada).not.toHaveBeenCalled();
    expect(criarConta).not.toHaveBeenCalled();

    // Senha fraca no prompt: recusa sem criar a conta.
    const respostasFracas = ["org@exemplo.test", "curta1!", "curta1!"];
    await expect(
      criarOrganizador({ argv: [], perguntar: async () => respostasFracas.shift() ?? "", criarConta, imprimir }),
    ).rejects.toThrow("SENHA_FRACA");
    expect(criarConta).not.toHaveBeenCalled();

    // Confirmação diferente: recusa.
    const respostasDiferentes = ["org@exemplo.test", "Abc123!@#xyz", "Abc123!@#xyw"];
    await expect(
      criarOrganizador({ argv: [], perguntar: async () => respostasDiferentes.shift() ?? "", criarConta, imprimir }),
    ).rejects.toThrow("SENHAS_DIFERENTES");

    // Senha forte, pedida com prompt oculto: cria a conta e imprime o UID.
    const perguntas: { texto: string; oculto: boolean }[] = [];
    const respostas = ["org@exemplo.test", "Abc123!@#xyz", "Abc123!@#xyz"];
    const uid = await criarOrganizador({
      argv: [],
      perguntar: async (texto, oculto) => {
        perguntas.push({ texto, oculto });
        return respostas.shift() ?? "";
      },
      criarConta,
      imprimir,
    });
    expect(uid).toBe("uid-123");
    expect(criarConta).toHaveBeenCalledWith("org@exemplo.test", "Abc123!@#xyz");
    expect(perguntas.filter((p) => /senha/i.test(p.texto)).every((p) => p.oculto)).toBe(true);
    expect(imprimir.mock.calls.flat().join("\n")).toContain("uid-123");
    expect(imprimir.mock.calls.flat().join("\n")).not.toContain("Abc123!@#xyz");
  });
});
