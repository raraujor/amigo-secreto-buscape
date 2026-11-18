import { readFileSync } from "node:fs";
import { type FirebaseApp, deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  type Firestore,
  Timestamp,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeEach, expect, it } from "vitest";
import { lerCsv } from "../../comum/csv";
import { gravarSorteio, importarParticipantes, lerLinks } from "../../site/src/app/dados/repositorio";

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
