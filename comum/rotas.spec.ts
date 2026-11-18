import { describe, expect, it } from "vitest";
import { destinoDaRota } from "./rotas";

describe("destinoDaRota", () => {
  it("US1 NFR-007 sem login vai para entrar e logado abre a área com importar e sortear", () => {
    expect(destinoDaRota("organizador", false)).toEqual({ tela: "entrar" });
    expect(destinoDaRota("organizador", true)).toEqual({ tela: "organizador", acoes: ["importar", "sortear"] });
    expect(destinoDaRota("entrar", true)).toEqual({ tela: "organizador", acoes: ["importar", "sortear"] });
  });

  it("US9 FR-007 rota do link é pública e entrega o token", () => {
    expect(destinoDaRota("l/AbCdEfGhIjKlMnOpQrStUv", false)).toEqual({ tela: "link", token: "AbCdEfGhIjKlMnOpQrStUv" });
    expect(destinoDaRota("l/AbCdEfGhIjKlMnOpQrStUv", true)).toEqual({ tela: "link", token: "AbCdEfGhIjKlMnOpQrStUv" });
  });
});
