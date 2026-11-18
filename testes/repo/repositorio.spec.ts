import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";

/** Pergunta ao git se o caminho seria ignorado (exit 0 = ignorado). */
function ignorado(caminho: string): boolean {
  try {
    execFileSync("git", ["check-ignore", "-q", "--no-index", caminho]);
    return true;
  } catch {
    return false;
  }
}

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

it("US1 NFR-006 nenhum arquivo versionado tem csv fora de fixtures, env, e-mail ou senha", () => {
  const arquivos = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter((a) => a !== "" && existsSync(a));
  expect(arquivos.filter((a) => /\.csv$/.test(a) && !a.startsWith("testes/fixtures/"))).toEqual([]);
  expect(arquivos.filter((a) => /(^|\/)\.env/.test(a))).toEqual([]);
  const proprios = arquivos.filter(
    (a) =>
      !a.startsWith("aidlc/") &&
      !a.startsWith(".claude/") &&
      !a.endsWith("package-lock.json") &&
      !a.startsWith("testes/repo/") &&
      /\.(ts|json|yml|yaml|rules|md|html|css)$/.test(a),
  );
  for (const arquivo of proprios) {
    const texto = readFileSync(arquivo, "utf8");
    // E-mail real (fora de exemplo.test/example) e senhas atribuídas em texto claro.
    const emails = texto.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? [];
    expect(emails.filter((e) => !/@(exemplo|example)\.(test|com)$/.test(e) && !/@(angular|types|firebase)\//.test(e) && !e.startsWith("npm@")), arquivo).toEqual([]);
    expect(texto, arquivo).not.toMatch(/(senha|password)\s*[:=]\s*["'][^"'\s(),;]{6,}["']/i);
  }
});

it("US1 NFR-006 fixture só tem números de DDD 00", () => {
  const linhas = readFileSync("testes/fixtures/familia-37.csv", "utf8").trim().split(/\r?\n/).slice(1);
  expect(linhas).toHaveLength(37);
  for (const linha of linhas) expect(linha.split(",")[1]).toMatch(/^\(00\) /);
});

it("US1 US2 US4 US9 FR-001 FR-004 FR-007 verificação manual registrada com todas as marcas ok e sem nomes nem links", () => {
  const texto = readFileSync("testes/manual/fatia-001.md", "utf8");
  const marcas = texto.match(/^- \[[ x]\]/gm) ?? [];
  expect(marcas.length).toBeGreaterThan(0);
  expect(marcas.every((m) => m === "- [x]")).toBe(true);
  expect(texto).not.toMatch(/https?:\/\//);
});

it("config do aidlc aponta o comando com os emuladores e o relatório junit", () => {
  expect(existsSync("aidlc/config.yaml")).toBe(true);
  const config = readFileSync("aidlc/config.yaml", "utf8");
  expect(config).toMatch(/emulators:exec.*--only.*firestore,auth/);
  expect(config).toMatch(/report:\s*"?\.aidlc-junit\.xml"?/);
});

it("US2 US4 US5 FR-001 FR-004 FR-006 verificação manual registrada com todas as marcas ok e sem nomes nem links", () => {
  const texto = readFileSync("testes/manual/preparacao-002.md", "utf8");
  const marcas = texto.match(/^- \[[ x]\]/gm) ?? [];
  expect(marcas.length).toBeGreaterThan(0);
  expect(marcas.every((m) => m === "- [x]")).toBe(true);
  expect(texto).not.toMatch(/https?:\/\//);
});
