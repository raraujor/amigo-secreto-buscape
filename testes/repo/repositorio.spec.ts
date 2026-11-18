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

it("US6 FR-008 a tela passa o endereço do site ao sortear", () => {
  // Inspeção do código da tela: é o único jeito automático de proteger esse ponto sem rodar a tela.
  const tela = readFileSync("site/src/app/organizador/organizador.ts", "utf8").split("\r\n").join("\n");
  expect(tela).toMatch(/gravarSorteio\(db,\s*\{[^}]*baseUrl/);
});

it("US6 US7 US8 FR-008 FR-009 FR-010 verificação manual registrada com todas as marcas ok e sem nomes nem links", () => {
  const texto = readFileSync("testes/manual/mensagens-003.md", "utf8");
  const marcas = texto.match(/^- \[[ x]\]/gm) ?? [];
  expect(marcas.length).toBeGreaterThan(0);
  expect(marcas.every((m) => m === "- [x]")).toBe(true);
  expect(texto).not.toMatch(/https?:\/\//);
});

it("o site pede aos buscadores para não indexar nenhuma página, mas mantém a prévia do link no WhatsApp", () => {
  const html = readFileSync("site/src/index.html", "utf8");
  expect(html).toMatch(/<meta name="robots" content="noindex, nofollow">/);
  expect(html).toContain('property="og:image"');
  expect(html).toContain('property="og:title"');
});

// ---- Sugestão de presente (unit/001 da intenção 261118): inspeção do código das telas ----

const telaDoOrganizador = () => readFileSync("site/src/app/organizador/organizador.ts", "utf8");
const paginaDoLink = () => readFileSync("site/src/app/link/link.ts", "utf8").split("\r\n").join("\n");

/** O corpo de um método da classe, do nome até a chave que o fecha (recuo de dois espaços). */
function corpoDoMetodo(codigo: string, nome: string): string {
  const comAsync = codigo.indexOf(`async ${nome}(`);
  const inicio = comAsync >= 0 ? comAsync : codigo.indexOf(`  ${nome}(`);
  expect(inicio, `método ${nome}`).toBeGreaterThan(-1);
  const fim = codigo.indexOf("\n  }\n", inicio);
  return codigo.slice(inicio, fim);
}

it("US1 FR-001 a tela do organizador usa gravarLista e mostra o erro sem perder o texto", () => {
  const tela = telaDoOrganizador();
  expect(tela).toContain("gravarLista(db, p.nome, this.textoEdicao)");
  const salvar = corpoDoMetodo(tela, "salvarLista");
  const aposCatch = salvar.slice(salvar.indexOf("catch"));
  expect(aposCatch).toContain("mensagemDeErro(");
  expect(aposCatch).toContain("erroLista.set(");
  // Na falha o texto digitado e a edição aberta ficam como estavam.
  expect(aposCatch).not.toContain("textoEdicao");
  expect(aposCatch).not.toContain("editando.set(null)");
});

it("US2 FR-002 a tela do organizador deixa mudar e apagar a lista e mantém o texto se falhar", () => {
  const tela = telaDoOrganizador();
  expect(corpoDoMetodo(tela, "abrirLista")).toContain("textoDaLista(");
  expect(tela).toContain('[(ngModel)]="textoEdicao"');
  expect(tela).toContain("Texto vazio apaga a lista");
  const salvar = corpoDoMetodo(tela, "salvarLista");
  expect(salvar.indexOf("editando.set(null)")).toBeGreaterThan(salvar.indexOf("gravarLista("));
});

it("US3 FR-003 a tela do organizador mostra com lista e sem lista ao lado de cada nome", () => {
  const tela = telaDoOrganizador();
  expect(tela).toContain("resumoDeListas(");
  expect(tela).toContain("com lista");
  expect(tela).toContain("sem lista");
  // Depois de salvar com sucesso a tela relê as listas guardadas.
  expect(corpoDoMetodo(tela, "salvarLista")).toContain("lerListas(db)");
});

it("US5 FR-005 a página lê a lista só no toque em revelar e usa estadoDaSugestao", () => {
  const pagina = paginaDoLink();
  expect(pagina).toContain("estadoDaSugestao(");
  expect(pagina.match(/lerPresente\(/g) ?? []).toHaveLength(1);
  expect(corpoDoMetodo(pagina, "revelar")).toContain("carregarSugestao(");
  expect(corpoDoMetodo(pagina, "ngOnInit")).not.toContain("carregarSugestao(");
  expect(corpoDoMetodo(pagina, "ngOnInit")).not.toContain("lerPresente(");
});

it("US5 FR-005 a página mostra os itens como texto e nunca como código", () => {
  const pagina = paginaDoLink();
  expect(pagina).not.toMatch(/innerHTML|bypassSecurityTrust|outerHTML|insertAdjacentHTML/);
  expect(pagina).toContain("{{ item }}");
});

it("US5 FR-005 a página não cria link tocável nos itens", () => {
  const pagina = paginaDoLink();
  const inicio = pagina.indexOf('class="presentes"');
  expect(inicio).toBeGreaterThan(-1);
  const trecho = pagina.slice(inicio, pagina.indexOf("</ul>", inicio));
  expect(trecho).not.toContain("<a ");
  expect(trecho).not.toContain("href");
});

it("US5 FR-005 a página mantém o texto e o destaque do nome do amigo", () => {
  const pagina = paginaDoLink();
  expect(pagina).toContain("estadoDaPaginaDoLink(this.link, true)");
  expect(pagina).toContain('class="amigo"');
  expect(pagina).toContain("textoAberto()");
});

it("US5 FR-007 a página mostra Link inválido para token inexistente e nenhuma lista", () => {
  const pagina = paginaDoLink();
  expect(pagina).toContain('@case ("invalido")');
  // Sem link, nada é lido: a leitura da lista só acontece com um link válido.
  expect(corpoDoMetodo(pagina, "carregarSugestao")).toMatch(/if \(!this\.link\) return/);
});

it("US6 FR-006 a página mostra o aviso quando a lista não existe", () => {
  const pagina = paginaDoLink();
  expect(pagina).toContain('@case ("aviso")');
  expect(pagina).toContain("textoDaSugestao()");
});

it("US7 FR-008 a página mostra a falha e mantém o nome do amigo", () => {
  const pagina = paginaDoLink();
  expect(pagina).toContain('@case ("falha")');
  const revelar = corpoDoMetodo(pagina, "revelar");
  // O nome do amigo aparece antes da leitura da lista, e a falha da lista nunca desfaz o resultado.
  expect(revelar.indexOf("estadoDaPaginaDoLink(this.link, true)")).toBeLessThan(revelar.indexOf("carregarSugestao("));
  expect(corpoDoMetodo(pagina, "carregarSugestao")).toContain("falhou: true");
});

it("US5 NFR-002 verificação manual da lista de presentes registrada com todas as marcas ok e sem nomes nem links", () => {
  const texto = readFileSync("testes/manual/lista-001.md", "utf8");
  const marcas = texto.match(/^- \[[ x]\]/gm) ?? [];
  expect(marcas.length).toBeGreaterThan(0);
  expect(marcas.every((m) => m === "- [x]")).toBe(true);
  expect(texto).not.toMatch(/https?:\/\//);
});
