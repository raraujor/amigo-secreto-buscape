import { readFileSync } from "node:fs";
import { type FirebaseApp, deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  type Firestore,
  Timestamp,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  disableNetwork,
  doc,
  enableNetwork,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeEach, expect, it } from "vitest";
import { lerCsv } from "../../comum/csv";
import { estadoDaPaginaDoLink } from "../../comum/pagina-link";
import {
  gravarEncontro,
  gravarSorteio,
  importarParticipantes,
  lerEncontro,
  lerLink,
  lerLinks,
  lerParticipantes,
  lerResultado,
  lerSorteioAtual,
  recomecar,
  resumoDoSorteio,
} from "../../site/src/app/dados/repositorio";

const PROJETO = "demo-amigo-secreto";
const ORGANIZADOR = /return '([^']+)';/.exec(readFileSync("firestore.rules", "utf8"))?.[1] ?? "";
const apps: FirebaseApp[] = [];

/** Firestore no emulador, agindo como o uid dado (ou como visitante, sem uid). */
function banco(uid?: string): Firestore {
  const app = initializeApp({ projectId: PROJETO, apiKey: "chave-falsa" }, `app-${apps.length}`);
  apps.push(app);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080, uid ? { mockUserToken: { sub: uid } } : undefined);
  return db;
}

async function limparBanco() {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJETO}/databases/(default)/documents`, {
    method: "DELETE",
  });
}

async function negado(promessa: Promise<unknown>) {
  await expect(promessa).rejects.toMatchObject({ code: "permission-denied" });
}

const COLECOES = ["participantes", "sorteios", "links", "mensagens", "config"];
const fixture = lerCsv(readFileSync("testes/fixtures/familia-37.csv", "utf8"));

let org: Firestore;
let visitante: Firestore;
let outraConta: Firestore;

beforeEach(async () => {
  await limparBanco();
  org = banco(ORGANIZADOR);
  visitante = banco();
  outraConta = banco("alguem-que-se-cadastrou");
});

afterAll(async () => {
  await Promise.all(apps.map((a) => deleteApp(a)));
});

/** Prepara um sorteio pequeno pelo organizador e devolve o token do link de "Ana". */
async function prepararLinkDeAna(): Promise<string> {
  await setDoc(doc(org, "links", "token-ana"), {
    participanteId: "a",
    participante: "Ana",
    amigo: "Bruno",
    sorteioId: "s1",
    abertoEm: null,
  });
  await setDoc(doc(org, "links", "token-bruno"), {
    participanteId: "b",
    participante: "Bruno",
    amigo: "Ana",
    sorteioId: "s1",
    abertoEm: null,
  });
  return "token-ana";
}

it("US1 NFR-007 organizador lê e grava participantes, sorteios, links, mensagens e config", async () => {
  for (const c of COLECOES) {
    const id = c === "config" ? "encontro" : "x";
    await setDoc(doc(org, c, id), { teste: true });
    expect((await getDoc(doc(org, c, id))).exists()).toBe(true);
    expect((await getDocs(collection(org, c))).size).toBe(1);
  }
});

it("US1 NFR-007 senha errada não autentica e nada é lido", async () => {
  const app = initializeApp({ projectId: PROJETO, apiKey: "chave-falsa" }, "app-auth");
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  await createUserWithEmailAndPassword(auth, `org-${Date.now()}@exemplo.test`, "Abc123!@#xyz").then(
    async ({ user }) => {
      await auth.signOut();
      await expect(signInWithEmailAndPassword(auth, user.email as string, "senha-errada-1!")).rejects.toMatchObject({
        code: "auth/wrong-password",
      });
      expect(auth.currentUser).toBeNull();
    },
  );
  await setDoc(doc(org, "participantes", "p1"), { nome: "Aurora Teste" });
  await negado(getDoc(doc(visitante, "participantes", "p1")));
});

it("US1 NFR-007 visitante tem permissão negada ao listar participantes, sorteios, links e mensagens", async () => {
  await prepararLinkDeAna();
  for (const c of ["participantes", "sorteios", "links", "mensagens"]) {
    await negado(getDocs(collection(visitante, c)));
  }
});

it("US1 NFR-007 outra conta logada não lê nem grava nada", async () => {
  await setDoc(doc(org, "participantes", "p1"), { nome: "Aurora Teste" });
  await setDoc(doc(org, "sorteios", "atual"), { id: "s1" });
  for (const c of ["participantes", "sorteios", "links", "mensagens"]) {
    await negado(getDocs(collection(outraConta, c)));
  }
  await negado(getDoc(doc(outraConta, "participantes", "p1")));
  await negado(getDoc(doc(outraConta, "sorteios", "atual")));
  await negado(setDoc(doc(outraConta, "participantes", "p2"), { nome: "Intrusa" }));
  await negado(setDoc(doc(outraConta, "config", "encontro"), { local: "Outro lugar" }));
  await negado(setDoc(doc(outraConta, "links", "falso"), { participante: "X", amigo: "Y", abertoEm: null }));
});

it("US1 NFR-007 visitante e outra conta não leem nem gravam em caminho não listado", async () => {
  await setDoc(doc(org, "qualquer", "coisa"), { segredo: true });
  await negado(getDoc(doc(visitante, "qualquer", "coisa")));
  await negado(getDocs(collection(visitante, "qualquer")));
  await negado(setDoc(doc(visitante, "qualquer", "outra"), { x: 1 }));
  await negado(getDoc(doc(outraConta, "qualquer", "coisa")));
});

it("US9 FR-007 com o token de Ana lê só o link de Ana", async () => {
  const token = await prepararLinkDeAna();
  await setDoc(doc(org, "config", "encontro"), { data: "20/12/2026", local: "Casa de teste", valor: "R$ 50" });

  const link = await getDoc(doc(visitante, "links", token));
  expect(link.data()).toMatchObject({ participante: "Ana", amigo: "Bruno" });
  expect((await getDoc(doc(visitante, "config", "encontro"))).data()).toMatchObject({ local: "Casa de teste" });
  expect((await getDoc(doc(visitante, "links", "token-que-nao-existe"))).exists()).toBe(false);
  await negado(getDocs(collection(visitante, "links")));
});

it("US9 FR-011 NFR-007 visitante não troca amigo nem participante do link", async () => {
  const token = await prepararLinkDeAna();
  await negado(updateDoc(doc(visitante, "links", token), { amigo: "Outra pessoa" }));
  await negado(updateDoc(doc(visitante, "links", token), { participante: "Outra pessoa" }));
  await negado(updateDoc(doc(visitante, "links", token), { abertoEm: serverTimestamp(), amigo: "Outra pessoa" }));
  expect((await getDoc(doc(org, "links", token))).data()).toMatchObject({ amigo: "Bruno", participante: "Ana" });
});

it("US9 FR-011 NFR-007 visitante não cria nem apaga links e não regrava abertoEm", async () => {
  const token = await prepararLinkDeAna();
  await negado(setDoc(doc(visitante, "links", "novo"), { participante: "X", amigo: "Y", abertoEm: null }));
  await negado(deleteDoc(doc(visitante, "links", token)));

  await updateDoc(doc(visitante, "links", token), { abertoEm: serverTimestamp() });
  await negado(updateDoc(doc(visitante, "links", token), { abertoEm: serverTimestamp() }));
});

it("US9 FR-011 NFR-007 visitante grava abertoEm com a hora do servidor e não com a hora do cliente", async () => {
  const token = await prepararLinkDeAna();
  await negado(updateDoc(doc(visitante, "links", token), { abertoEm: Timestamp.fromMillis(Date.now()) }));
  await updateDoc(doc(visitante, "links", token), { abertoEm: serverTimestamp() });
  const aberto = (await getDoc(doc(org, "links", token))).data()?.abertoEm;
  expect(aberto).toBeInstanceOf(Timestamp);
});

it("US4 FR-004 importar substitui todos os participantes", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  await importarParticipantes(org, fixture);
  const todos = await getDocs(collection(org, "participantes"));
  expect(todos.size).toBe(37);
  const nomes = todos.docs.map((d) => d.data()).sort((a, b) => a.ordem - b.ordem).map((p) => p.nome);
  expect(nomes).toEqual(fixture.map((l) => l.nome));
});

it("US4 FR-004 sortear grava sorteio e 37 links e apaga os antigos de uma vez", async () => {
  await importarParticipantes(org, fixture);
  const primeiro = await gravarSorteio(org);
  const linksPrimeiro = await getDocs(collection(org, "links"));
  expect(linksPrimeiro.size).toBe(37);

  const segundo = await gravarSorteio(org);
  expect(segundo.sorteioId).not.toBe(primeiro.sorteioId);
  const linksSegundo = await getDocs(collection(org, "links"));
  expect(linksSegundo.size).toBe(37);
  expect(linksSegundo.docs.every((d) => d.data().sorteioId === segundo.sorteioId)).toBe(true);
  for (const antigo of linksPrimeiro.docs) {
    expect((await getDoc(doc(visitante, "links", antigo.id))).exists()).toBe(false);
  }

  const amigos = linksSegundo.docs.map((d) => d.data());
  expect(new Set(amigos.map((l) => l.amigo)).size).toBe(37);
  expect(amigos.every((l) => l.amigo !== l.participante && l.abertoEm === null)).toBe(true);
  expect((await getDoc(doc(org, "sorteios", "atual"))).data()).toMatchObject({
    id: segundo.sorteioId,
    enviosIniciados: false,
  });
});

it("US4 FR-004 lerLinks devolve o token e o nome de cada participante depois do sorteio, para os links não sumirem ao recarregar", async () => {
  await importarParticipantes(org, fixture);
  const { tokens } = await gravarSorteio(org);
  const links = await lerLinks(org);
  expect(links).toHaveLength(37);
  for (const link of links) expect(tokens.get(link.participanteId)).toBe(link.token);
  expect(new Set(links.map((l) => l.participante)).size).toBe(37);
  expect(JSON.stringify(links)).not.toContain("amigo");
});

it("US4 FR-004 lerSorteioAtual devolve a data e hora em que o sorteio foi feito e null antes dele", async () => {
  expect(await lerSorteioAtual(org)).toBeNull();
  await importarParticipantes(org, fixture);
  const antes = Date.now();
  const { sorteioId } = await gravarSorteio(org);
  const sorteio = await lerSorteioAtual(org);
  expect(sorteio?.id).toBe(sorteioId);
  expect(sorteio?.criadoEm).toBeInstanceOf(Date);
  expect(Math.abs((sorteio?.criadoEm.getTime() ?? 0) - antes)).toBeLessThan(60_000);
});

it("US4 FR-004 lerLinks mostra quem já tocou em Ver quem eu tirei e quando", async () => {
  await importarParticipantes(org, fixture.slice(0, 3));
  const { tokens } = await gravarSorteio(org);
  const antes = await lerLinks(org);
  expect(antes.every((l) => l.abertoEm === null)).toBe(true);
  const [primeiro] = antes;
  await updateDoc(doc(visitante, "links", tokens.get(primeiro.participanteId) as string), { abertoEm: serverTimestamp() });
  const depois = await lerLinks(org);
  const abertos = depois.filter((l) => l.abertoEm !== null);
  expect(abertos.map((l) => l.participanteId)).toEqual([primeiro.participanteId]);
  expect(abertos[0].abertoEm).toBeInstanceOf(Date);
});

it("US3 FR-003 o organizador grava os dados do encontro e o visitante os lê, mesmo sem login", async () => {
  expect(await lerEncontro(org)).toBeNull();
  const dados = { data: "24/12/2026", local: "Fazenda da Titia", valor: "R$ 50,00" };
  await gravarEncontro(org, dados);
  expect(await lerEncontro(org)).toEqual(dados);
  expect(await lerEncontro(visitante)).toEqual(dados);
  await negado(gravarEncontro(visitante, { ...dados, local: "Outro lugar" }));
});

/** Grava direto no banco uma mensagem com o status dado (a 003 é quem a grava no site). */
async function mensagem(db: Firestore, id: string, status: "pendente" | "enviada" | "falha") {
  await setDoc(doc(db, "mensagens", id), { token: "x", whatsapp: "5500910002000", texto: "oi", status });
}

async function tamanho(db: Firestore, colecao: string) {
  return (await getDocs(collection(db, colecao))).size;
}

it("US2 FR-001 importar de novo antes do envio descarta participantes, sorteio, links e mensagens antigos, os links antigos ficam inválidos e as aberturas zeradas", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const { tokens } = await gravarSorteio(org);
  const tokenAntigo = [...tokens.values()][0];
  await mensagem(org, "m1", "pendente");
  await updateDoc(doc(visitante, "links", tokenAntigo), { abertoEm: serverTimestamp() });
  const idsAntigos = (await lerParticipantes(org)).map((p) => p.id);

  await importarParticipantes(org, fixture.slice(5, 9));

  expect(await tamanho(org, "links")).toBe(0);
  expect(await tamanho(org, "mensagens")).toBe(0);
  expect((await getDoc(doc(org, "sorteios", "atual"))).exists()).toBe(false);
  const novos = await lerParticipantes(org);
  expect(novos.map((p) => p.nome)).toEqual(fixture.slice(5, 9).map((l) => l.nome));
  for (const id of idsAntigos) expect(novos.map((p) => p.id)).not.toContain(id);
  expect(await lerLink(visitante, tokenAntigo)).toBeNull();
});

it("US2 FR-001 importar depois de uma mensagem enviada é recusado e nada muda", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  await gravarSorteio(org);
  await mensagem(org, "m1", "enviada");
  const antes = (await lerParticipantes(org)).map((p) => p.nome);

  await expect(importarParticipantes(org, fixture.slice(5, 9))).rejects.toThrow("ENVIO_INICIADO");

  expect((await lerParticipantes(org)).map((p) => p.nome)).toEqual(antes);
  expect(await tamanho(org, "links")).toBe(5);
  expect(await tamanho(org, "mensagens")).toBe(1);
});

it("US2 FR-001 importar com mensagem pendente ou com falha é aceito", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  await gravarSorteio(org);
  await mensagem(org, "m1", "pendente");
  await mensagem(org, "m2", "falha");
  await importarParticipantes(org, fixture.slice(5, 9));
  expect((await lerParticipantes(org)).map((p) => p.nome)).toEqual(fixture.slice(5, 9).map((l) => l.nome));
});

it("US2 FR-001 sem conseguir conferir os links no servidor a importação é recusada com ENVIO_INDEFINIDO", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  await disableNetwork(org);
  try {
    await expect(importarParticipantes(org, fixture.slice(5, 9))).rejects.toThrow("ENVIO_INDEFINIDO");
  } finally {
    await enableNetwork(org);
  }
  expect((await lerParticipantes(org)).map((p) => p.nome)).toEqual(fixture.slice(0, 5).map((l) => l.nome));
});

it("US4 FR-004 sortear de novo antes do envio substitui o resultado, apaga as mensagens antigas e os links antigos mostram link inválido", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const primeiro = await gravarSorteio(org);
  const tokenAntigo = [...primeiro.tokens.values()][0];
  await mensagem(org, "m1", "pendente");

  const segundo = await gravarSorteio(org);

  expect(segundo.sorteioId).not.toBe(primeiro.sorteioId);
  const links = await getDocs(collection(org, "links"));
  expect(links.size).toBe(5);
  expect(links.docs.every((d) => d.data().sorteioId === segundo.sorteioId)).toBe(true);
  expect(await tamanho(org, "mensagens")).toBe(0);
  expect(await lerLink(visitante, tokenAntigo)).toBeNull();
});

it("US4 FR-004 sortear de novo zera as aberturas", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const { tokens } = await gravarSorteio(org);
  await updateDoc(doc(visitante, "links", [...tokens.values()][0]), { abertoEm: serverTimestamp() });
  expect((await lerLinks(org)).filter((l) => l.abertoEm !== null)).toHaveLength(1);

  await gravarSorteio(org);

  expect((await lerLinks(org)).every((l) => l.abertoEm === null)).toBe(true);
});

it("US4 FR-004 sortear depois de uma mensagem enviada é recusado e os links continuam valendo", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const { sorteioId, tokens } = await gravarSorteio(org);
  const token = [...tokens.values()][0];
  await mensagem(org, "m1", "enviada");

  await expect(gravarSorteio(org)).rejects.toThrow("ENVIO_INICIADO");

  expect((await lerSorteioAtual(org))?.id).toBe(sorteioId);
  expect(await tamanho(org, "links")).toBe(5);
  expect(await lerLink(visitante, token)).not.toBeNull();
});

it("US4 FR-004 mensagem pendente ou com falha não trava o sorteio", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  await gravarSorteio(org);
  await mensagem(org, "m1", "pendente");
  await mensagem(org, "m2", "falha");
  await expect(gravarSorteio(org)).resolves.toBeDefined();
});

it("US4 FR-004 sem conseguir conferir os links no servidor o sorteio é recusado com ENVIO_INDEFINIDO", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const { sorteioId } = await gravarSorteio(org);
  await disableNetwork(org);
  try {
    await expect(gravarSorteio(org)).rejects.toThrow("ENVIO_INDEFINIDO");
  } finally {
    await enableNetwork(org);
  }
  expect((await lerSorteioAtual(org))?.id).toBe(sorteioId);
});

it("US4 FR-005 com um casal, sortear de novo ainda os põe para tirar um ao outro", async () => {
  await importarParticipantes(org, fixture.slice(0, 2));
  await gravarSorteio(org);
  await gravarSorteio(org);
  const [a, b] = fixture.slice(0, 2).map((l) => l.nome);
  const resultado = await lerResultado(org);
  expect(resultado).toEqual([
    { participante: a, amigo: b },
    { participante: b, amigo: a },
  ]);
});

it("US5 FR-006 lerResultado devolve os 37 pares, cada pessoa tira uma e é tirada uma", async () => {
  await importarParticipantes(org, fixture);
  await gravarSorteio(org);
  const resultado = await lerResultado(org);
  expect(resultado).toHaveLength(37);
  expect(resultado.map((r) => r.participante)).toEqual(fixture.map((l) => l.nome));
  expect(new Set(resultado.map((r) => r.amigo)).size).toBe(37);
  expect(resultado.every((r) => r.amigo !== r.participante)).toBe(true);
});

it("US5 FR-006 só o organizador lê o resultado completo", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  await gravarSorteio(org);
  await negado(lerResultado(visitante));
  await negado(lerResultado(outraConta));
});

it("US3 FR-003 o repositório devolve ao visitante data, local e valor gravados pelo organizador", async () => {
  const dados = { data: "24/12/2026", local: "Fazenda da Titia", valor: "R$ 50,00" };
  await gravarEncontro(org, dados);
  expect(await lerEncontro(visitante)).toEqual(dados);
});

it("US3 FR-003 corrigir o local depois do envio faz o repositório devolver o local novo ao visitante", async () => {
  await gravarEncontro(org, { data: "20/12/2026", local: "Casa da vó", valor: "R$ 50" });
  await importarParticipantes(org, fixture.slice(0, 3));
  await gravarSorteio(org);
  await mensagem(org, "m1", "enviada");
  await gravarEncontro(org, { data: "20/12/2026", local: "Casa da tia", valor: "R$ 50" });
  expect((await lerEncontro(visitante))?.local).toBe("Casa da tia");
});

it("US1 NFR-007 o organizador grava o encontro e lê o resultado completo, e visitante e outra conta não", async () => {
  const dados = { data: "24/12/2026", local: "Fazenda da Titia", valor: "R$ 50,00" };
  await importarParticipantes(org, fixture.slice(0, 3));
  await gravarSorteio(org);
  await gravarEncontro(org, dados);
  expect(await lerResultado(org)).toHaveLength(3);
  await negado(gravarEncontro(visitante, { ...dados, local: "Outro" }));
  await negado(gravarEncontro(outraConta, { ...dados, local: "Outro" }));
  await negado(lerResultado(visitante));
  await negado(lerResultado(outraConta));
  expect((await lerEncontro(org))?.local).toBe("Fazenda da Titia");
});

it("US9 FR-007 link de um sorteio substituído mostra link inválido sem nome", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const { tokens } = await gravarSorteio(org);
  const tokenAntigo = [...tokens.values()][0];
  await gravarSorteio(org);
  const link = await lerLink(visitante, tokenAntigo);
  expect(link).toBeNull();
  expect(estadoDaPaginaDoLink(link, true)).toEqual({ tipo: "invalido", texto: "Link inválido, fale com o organizador." });
});

it("US9 FR-011 depois de sortear de novo nenhum link aparece como aberto", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const { tokens } = await gravarSorteio(org);
  for (const token of tokens.values()) await updateDoc(doc(visitante, "links", token), { abertoEm: serverTimestamp() });
  await gravarSorteio(org);
  expect((await lerLinks(org)).filter((l) => l.abertoEm !== null)).toEqual([]);
});

it("US4 FR-004 recomeçar depois de uma mensagem enviada apaga sorteio, links e mensagens, mantém os participantes e o encontro e solta a trava", async () => {
  const dados = { data: "24/12/2026", local: "Fazenda da Titia", valor: "R$ 50,00" };
  await importarParticipantes(org, fixture.slice(0, 5));
  await gravarEncontro(org, dados);
  await gravarSorteio(org);
  await mensagem(org, "m1", "enviada");
  await expect(gravarSorteio(org)).rejects.toThrow("ENVIO_INICIADO");

  await recomecar(org);

  expect(await tamanho(org, "links")).toBe(0);
  expect(await tamanho(org, "mensagens")).toBe(0);
  expect((await getDoc(doc(org, "sorteios", "atual"))).exists()).toBe(false);
  expect(await tamanho(org, "participantes")).toBe(5);
  expect(await lerEncontro(org)).toEqual(dados);
  await expect(gravarSorteio(org)).resolves.toBeDefined();
});

it("US4 FR-004 depois de recomeçar os links antigos mostram link inválido e dá para importar e sortear de novo", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const { tokens } = await gravarSorteio(org);
  const tokenAntigo = [...tokens.values()][0];
  await mensagem(org, "m1", "enviada");

  await recomecar(org);

  expect(await lerLink(visitante, tokenAntigo)).toBeNull();
  await importarParticipantes(org, fixture.slice(5, 9));
  await gravarSorteio(org);
  expect(await tamanho(org, "links")).toBe(4);
});

it("US4 FR-004 visitante e outra conta não conseguem recomeçar e nada é apagado", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  await gravarSorteio(org);
  await mensagem(org, "m1", "enviada");
  await negado(recomecar(visitante));
  await negado(recomecar(outraConta));
  expect(await tamanho(org, "links")).toBe(5);
  expect(await tamanho(org, "mensagens")).toBe(1);
  expect((await getDoc(doc(org, "sorteios", "atual"))).exists()).toBe(true);
});

it("US4 FR-004 resumoDoSorteio conta os links, as mensagens enviadas e os links já abertos", async () => {
  await importarParticipantes(org, fixture.slice(0, 5));
  const { tokens } = await gravarSorteio(org);
  await mensagem(org, "m1", "enviada");
  await mensagem(org, "m2", "enviada");
  await mensagem(org, "m3", "pendente");
  await updateDoc(doc(visitante, "links", [...tokens.values()][0]), { abertoEm: serverTimestamp() });
  expect(await resumoDoSorteio(org)).toEqual({ links: 5, enviadas: 2, abertos: 1 });
});
