/**
 * Cria a conta do organizador no Firebase Authentication e imprime o UID para as regras.
 *
 * Uso, no computador do organizador:  npx tsx scripts/criar-organizador.ts
 *
 * O e-mail e a senha são pedidos no terminal; a senha é digitada sem aparecer e nunca é
 * aceita por argumento nem por variável de ambiente (ficaria no histórico do terminal).
 * Nada é gravado em arquivo.
 */
import { senhaForte } from "../comum/senha";

export interface Dependencias {
  argv: string[];
  perguntar: (texto: string, oculto: boolean) => Promise<string>;
  criarConta: (email: string, senha: string) => Promise<string>;
  imprimir: (texto: string) => void;
}

export async function criarOrganizador({ argv, perguntar, criarConta, imprimir }: Dependencias): Promise<string> {
  if (argv.some((a) => /senha|password/i.test(a))) throw new Error("SENHA_POR_ARGUMENTO");

  const email = (await perguntar("E-mail do organizador: ", false)).trim();
  const senha = await perguntar("Senha (12+ caracteres, com letra, número e símbolo): ", true);
  if (!senhaForte(senha)) throw new Error("SENHA_FRACA");
  const confirmacao = await perguntar("Repita a senha: ", true);
  if (confirmacao !== senha) throw new Error("SENHAS_DIFERENTES");

  const uid = await criarConta(email, senha);
  imprimir(`Conta criada. UID do organizador: ${uid}`);
  imprimir("Coloque esse UID em ORGANIZADOR_UID, no arquivo firestore.rules, e publique as regras.");
  return uid;
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

/** Cria a conta pela API REST do Firebase Auth, com a apiKey pública do site. */
async function criarContaNoFirebase(email: string, senha: string): Promise<string> {
  const { environment } = await import("../site/src/environments/environment");
  const resposta = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebase.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: senha, returnSecureToken: false }),
    },
  );
  const corpo = (await resposta.json()) as { localId?: string; error?: { message: string } };
  if (!resposta.ok || !corpo.localId) throw new Error(`FIREBASE:${corpo.error?.message ?? resposta.status}`);
  return corpo.localId;
}

const rodandoDireto = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/criar-organizador.ts");
if (rodandoDireto) {
  criarOrganizador({
    argv: process.argv.slice(2),
    perguntar: perguntarNoTerminal,
    criarConta: criarContaNoFirebase,
    imprimir: (t) => console.log(t),
  }).catch((erro: Error) => {
    console.error(`Não foi possível criar a conta: ${erro.message}`);
    process.exit(1);
  });
}
