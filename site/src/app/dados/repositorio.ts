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
  Timestamp,
  serverTimestamp,
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

/** Substitui todos os participantes pelos da planilha, numa gravação atômica. */
export async function importarParticipantes(db: Firestore, linhas: readonly LinhaParticipante[]): Promise<void> {
  const antigos = await getDocs(collection(db, "participantes"));
  const lote = writeBatch(db);
  for (const antigo of antigos.docs) lote.delete(antigo.ref);
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
 * Sorteia e grava, num único writeBatch atômico: os links antigos são apagados, um link
 * novo por participante é criado e sorteios/atual é regravado. Ou tudo, ou nada.
 */
export async function gravarSorteio(
  db: Firestore,
  sortearFn: typeof sortear = sortear,
  gerarToken: () => string = gerarTokenPadrao,
): Promise<{ sorteioId: string; tokens: Map<string, string> }> {
  const participantes = await lerParticipantes(db);
  const pares = sortearFn(participantes.map((p) => p.id));
  const sorteioId = gerarToken();
  const links = montarLinks(participantes, pares, sorteioId, gerarToken);
  const antigos = await getDocs(collection(db, "links"));

  const lote = writeBatch(db);
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
