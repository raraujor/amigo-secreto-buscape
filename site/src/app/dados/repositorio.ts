/**
 * Gravação no Firestore, sem Angular: chamada pelos componentes do site e pelos testes
 * contra o emulador (testes/regras/regras.spec.ts), para que o teste prove o código do site.
 */
import {
  type Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  limit,
  query,
  Timestamp,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { LinhaParticipante } from "../../../../comum/csv";
import { montarLinks } from "../../../../comum/links";
import { sortear } from "../../../../comum/sorteio";
import { gerarToken as gerarTokenPadrao } from "../../../../comum/token";

export interface Participante {
  id: string;
  nome: string;
  whatsapp: string;
  responsavel: string | null;
  ordem: number;
}

/**
 * Verdadeiro se alguma mensagem já foi marcada como enviada. Lê sempre do servidor (nunca do
 * cache) e falha fechado: se não conseguir conferir, lança ENVIO_INDEFINIDO e quem chamou não
 * faz nada. Só "enviada" trava; pendente e com falha não.
 */
export async function envioIniciado(db: Firestore): Promise<boolean> {
  try {
    const enviadas = await getDocsFromServer(query(collection(db, "mensagens"), where("status", "==", "enviada"), limit(1)));
    return !enviadas.empty;
  } catch {
    throw new Error("ENVIO_INDEFINIDO");
  }
}

/** Marca para apagar, num lote, o sorteio atual e tudo o que depende dele (links e mensagens). */
async function apagarSorteio(db: Firestore, lote: ReturnType<typeof writeBatch>): Promise<void> {
  const [links, mensagens] = await Promise.all([getDocs(collection(db, "links")), getDocs(collection(db, "mensagens"))]);
  for (const d of links.docs) lote.delete(d.ref);
  for (const d of mensagens.docs) lote.delete(d.ref);
  lote.delete(doc(db, "sorteios", "atual"));
}

/**
 * Substitui todos os participantes pelos da planilha, numa gravação atômica, e descarta o sorteio
 * anterior (links, mensagens e aberturas). Depois que uma mensagem foi enviada, recusa com
 * ENVIO_INICIADO e nada muda.
 */
export async function importarParticipantes(db: Firestore, linhas: readonly LinhaParticipante[]): Promise<void> {
  if (await envioIniciado(db)) throw new Error("ENVIO_INICIADO");
  const antigos = await getDocs(collection(db, "participantes"));
  const lote = writeBatch(db);
  for (const antigo of antigos.docs) lote.delete(antigo.ref);
  await apagarSorteio(db, lote);
  linhas.forEach((linha, ordem) => {
    lote.set(doc(collection(db, "participantes")), { ...linha, ordem });
  });
  await lote.commit();
}

/** Lê os participantes na ordem da planilha. */
export async function lerParticipantes(db: Firestore): Promise<Participante[]> {
  const todos = await getDocs(collection(db, "participantes"));
  return todos.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Participante, "id">) }))
    .sort((a, b) => a.ordem - b.ordem);
}

/**
 * Sorteia e grava, num único writeBatch atômico: os links e as mensagens antigos são apagados,
 * um link novo por participante é criado e sorteios/atual é regravado. Ou tudo, ou nada. Depois
 * que uma mensagem foi enviada, recusa com ENVIO_INICIADO e nada muda.
 */
export async function gravarSorteio(
  db: Firestore,
  sortearFn: typeof sortear = sortear,
  gerarToken: () => string = gerarTokenPadrao,
): Promise<{ sorteioId: string; tokens: Map<string, string> }> {
  if (await envioIniciado(db)) throw new Error("ENVIO_INICIADO");
  const participantes = await lerParticipantes(db);
  const pares = sortearFn(participantes.map((p) => p.id));
  const sorteioId = gerarToken();
  const links = montarLinks(participantes, pares, sorteioId, gerarToken);

  const lote = writeBatch(db);
  const mensagens = await getDocs(collection(db, "mensagens"));
  for (const d of mensagens.docs) lote.delete(d.ref);
  const antigos = await getDocs(collection(db, "links"));
  for (const antigo of antigos.docs) lote.delete(antigo.ref);
  for (const { token, ...link } of links) lote.set(doc(db, "links", token), link);
  lote.set(doc(db, "sorteios", "atual"), { id: sorteioId, criadoEm: serverTimestamp(), enviosIniciados: false });
  await lote.commit();

  return { sorteioId, tokens: new Map(links.map((l) => [l.participanteId, l.token])) };
}

/** Lê um link pelo token (visitante). Devolve null se não existir. */
export async function lerLink(
  db: Firestore,
  token: string,
): Promise<{ participante: string; amigo: string } | null> {
  const link = await getDoc(doc(db, "links", token));
  if (!link.exists()) return null;
  const { participante, amigo } = link.data() as { participante: string; amigo: string };
  return { participante, amigo };
}

/**
 * Lê os links já gerados (token, nome de quem recebe e quando tocou em "Ver quem eu tirei"),
 * sem o nome do amigo, para a área do organizador mostrá-los depois de recarregar a página.
 */
export async function lerLinks(
  db: Firestore,
): Promise<{ token: string; participanteId: string; participante: string; abertoEm: Date | null }[]> {
  const todos = await getDocs(collection(db, "links"));
  return todos.docs.map((d) => {
    const { participanteId, participante, abertoEm } = d.data() as {
      participanteId: string;
      participante: string;
      abertoEm: Timestamp | null;
    };
    return { token: d.id, participanteId, participante, abertoEm: abertoEm ? abertoEm.toDate() : null };
  });
}

/** Quando o sorteio atual foi feito; null se ainda não houve sorteio. */
export async function lerSorteioAtual(db: Firestore): Promise<{ id: string; criadoEm: Date } | null> {
  const sorteio = await getDoc(doc(db, "sorteios", "atual"));
  if (!sorteio.exists()) return null;
  const { id, criadoEm } = sorteio.data() as { id: string; criadoEm: Timestamp };
  return { id, criadoEm: criadoEm.toDate() };
}

export interface Encontro {
  data: string;
  local: string;
  valor: string;
}

/** Lê os dados do encontro (data, local e valor sugerido); null se ainda não foram informados. */
export async function lerEncontro(db: Firestore): Promise<Encontro | null> {
  const dados = await getDoc(doc(db, "config", "encontro"));
  if (!dados.exists()) return null;
  const { data, local, valor } = dados.data() as Encontro;
  return { data, local, valor };
}

/** Grava os dados do encontro, que valem para todos os participantes. */
export async function gravarEncontro(db: Firestore, encontro: Encontro): Promise<void> {
  const { data, local, valor } = encontro;
  await setDoc(doc(db, "config", "encontro"), { data, local, valor });
}

/**
 * Recomeça do zero (decisão D-004), mesmo depois do envio: apaga o sorteio, todos os links e
 * todas as mensagens (inclusive as enviadas) num lote só, e mantém participantes e encontro.
 * Em caso de falha nada é apagado.
 */
export async function recomecar(db: Firestore): Promise<void> {
  const lote = writeBatch(db);
  await apagarSorteio(db, lote);
  await lote.commit();
}

/** O tamanho do que um recomeço apagaria: links, mensagens já enviadas e links já abertos. */
export async function resumoDoSorteio(db: Firestore): Promise<{ links: number; enviadas: number; abertos: number }> {
  const [links, mensagens] = await Promise.all([getDocs(collection(db, "links")), getDocs(collection(db, "mensagens"))]);
  return {
    links: links.size,
    enviadas: mensagens.docs.filter((d) => (d.data() as { status?: string }).status === "enviada").length,
    abertos: links.docs.filter((d) => (d.data() as { abertoEm?: unknown }).abertoEm != null).length,
  };
}

/** O resultado completo (quem tirou quem), na ordem da planilha. Só o organizador consegue ler. */
export async function lerResultado(db: Firestore): Promise<{ participante: string; amigo: string }[]> {
  const [participantes, links] = await Promise.all([lerParticipantes(db), getDocs(collection(db, "links"))]);
  const amigoDe = new Map(
    links.docs.map((d) => {
      const { participanteId, amigo } = d.data() as { participanteId: string; amigo: string };
      return [participanteId, amigo] as const;
    }),
  );
  return participantes
    .filter((p) => amigoDe.has(p.id))
    .map((p) => ({ participante: p.nome, amigo: amigoDe.get(p.id) as string }));
}
