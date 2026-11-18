import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Pergunta ao git se o caminho seria ignorado (exit 0 = ignorado). */
function ignorado(caminho: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", "--no-index", caminho]);
    return true;
  } catch {
    return false;
  }
}

describe("repositório", () => {
  it("US1 NFR-006 gitignore barra csv fora de fixtures, env, chaves e artefatos do emulador", () => {
    for (const caminho of [
      "familia.csv",
      "site/planilha.csv",
      ".env",
      ".env.local",
      "conta-de-servico.json.key",
      "chave.pem",
      ".firebase/hosting.cache",
      "firestore-debug.log",
      "ui-debug.log",
      ".aidlc-junit.xml",
    ]) {
      expect(ignorado(caminho), caminho).toBe(true);
    }
    expect(ignorado("testes/fixtures/familia-37.csv")).toBe(false);
    expect(readFileSync(".gitignore", "utf8")).toContain("node_modules");
  });
});
