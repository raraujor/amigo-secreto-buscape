/**
 * Backup somente leitura do banco (Cloud Firestore) para arquivos JSON no computador do organizador.
 *
 * Uso:  npx tsx scripts/backup.ts [pasta-de-saida]      (padrão: backups/)
 *
 * Entra com a conta do organizador (e-mail e senha pedidos no terminal; a senha é digitada sem
 * aparecer e nunca é aceita por argumento) e só LÊ: nada é gravado nem apagado no banco.
 * Cada coleção vira um arquivo no formato da API REST do Firestore, sem perdas, dentro de uma
 * pasta com data e hora. A pasta `backups/` é ignorada pelo git: contém os dados reais da família.
 */
export const COLECOES = ["participantes", "sorteios", "links", "mensagens", "config"] as const;

export interface Dependencias {
  argv: string[];
  perguntar: (texto: string, oculto: boolean) => Promise<string>;
  entrar: (email: string, senha: string) => Promise<string>;
  listar: (colecao: string, token: string, paginaToken?: string) => Promise<{ documents?: unknown[]; nextPageToken?: string }>;
  gravar: (arquivo: string, conteudo: string) => Promise<void>;
  imprimir: (texto: string) => void;
  agora: () => Date;
}

export async function fazerBackup({ argv, perguntar, entrar, listar, gravar, imprimir, agora }: Dependencias): Promise<Record<string, number>> {
  if (argv.some((a) => /senha|password/i.test(a))) throw new Error("SENHA_POR_ARGUMENTO");
  const saida = argv[0] ?? "backups";

  const email = (await perguntar("E-mail do organizador: ", false)).trim();
  const senha = await perguntar("Senha: ", true);
  const token = await entrar(email, senha);

  const pasta = `${saida}/${agora().toISOString().replace(/[:.]/g, "-")}`;
  const contagens: Record<string, number> = {};
  for (const colecao of COLECOES) {
    const documentos: unknown[] = [];
    let pagina: string | undefined;
    do {
      const resposta = await listar(colecao, token, pagina);
      documentos.push(...(resposta.documents ?? []));
      pagina = resposta.nextPageToken;
    } while (pagina);
    await gravar(`${pasta}/${colecao}.json`, JSON.stringify(documentos, null, 2));
    contagens[colecao] = documentos.length;
  }
  await gravar(`${pasta}/resumo.json`, JSON.stringify({ geradoEm: agora().toISOString(), documentos: contagens }, null, 2));
  imprimir(`Backup gravado em ${pasta}`);
  for (const [colecao, n] of Object.entries(contagens)) imprimir(`  ${colecao}: ${n} documento(s)`);
  return contagens;
}

/** Pergunta no terminal; com oculto, não mostra o que é digitado. */
async function perguntarNoTerminal(texto: string, oculto: boolean): Promise<string> {
  const readline = await import("node:readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const saida = rl as unknown as { _writeToOutput: (s: string) => void };
  const original = saida._writeToOutput.bind(rl);
  return new Promise((resolve) => {
    rl.question(texto, (resposta) => {
      saida._writeToOutput = original;
      if (oculto) process.stdout.write("\n");
      rl.close();
      resolve(resposta);
    });
    if (oculto) saida._writeToOutput = (s) => (s.startsWith(texto) ? original(texto) : undefined);
  });
}

async function entrarNoFirebase(email: string, senha: string): Promise<string> {
  const { environment } = await import("../site/src/environments/environment");
  const resposta = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebase.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    },
  );
  const corpo = (await resposta.json()) as { idToken?: string; error?: { message: string } };
  if (!resposta.ok || !corpo.idToken) throw new Error(`LOGIN:${corpo.error?.message ?? resposta.status}`);
  return corpo.idToken;
}

async function listarNoFirestore(colecao: string, token: string, paginaToken?: string) {
  const { environment } = await import("../site/src/environments/environment");
  const base = `https://firestore.googleapis.com/v1/projects/${environment.firebase.projectId}/databases/(default)/documents/${colecao}`;
  const url = `${base}?pageSize=300${paginaToken ? `&pageToken=${encodeURIComponent(paginaToken)}` : ""}`;
  const resposta = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resposta.ok) throw new Error(`LEITURA:${colecao}:${resposta.status}`);
  return (await resposta.json()) as { documents?: unknown[]; nextPageToken?: string };
}

const rodandoDireto = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/backup.ts");
if (rodandoDireto) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  fazerBackup({
    argv: process.argv.slice(2),
    perguntar: perguntarNoTerminal,
    entrar: entrarNoFirebase,
    listar: listarNoFirestore,
    gravar: async (arquivo, conteudo) => {
      await mkdir(dirname(arquivo), { recursive: true });
      await writeFile(arquivo, conteudo, "utf8");
    },
    imprimir: (t) => console.log(t),
    agora: () => new Date(),
  }).catch((erro: Error) => {
    console.error(`Não foi possível fazer o backup: ${erro.message}`);
    process.exit(1);
  });
}
