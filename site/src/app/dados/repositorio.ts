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
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { LinhaParticipante } from "../../../../comum/csv";
import { chaveDaLista, lerLista } from "../../../../comum/lista";
import { montarLinks } from "../../../../comum/links";
import { sortear } from "../../../../comum/sorteio";
import { type StatusDaMensagem, gerarMensagens } from "../../../../comum/mensagens";
import { gerarToken as gerarTokenPadrao } from "../../../../comum/token";

/** Endereço de exemplo, só para os testes; a tela passa sempre o endereço do site. */
const BASE_PADRAO = "https://exemplo.test/#/l/";

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

/** Marca para apagar, num lote, o sorteio atual e tudo o que depende dele (links, mensagens e presentes; nunca as listas). */
async function apagarSorteio(db: Firestore, lote: ReturnType<typeof writeBatch>): Promise<void> {
  const [links, mensagens, presentes] = await Promise.all([
    getDocs(collection(db, "links")),
    getDocs(collection(db, "mensagens")),
    getDocs(collection(db, "presentes")),
  ]);
  for (const d of links.docs) lote.delete(d.ref);
  for (const d of mensagens.docs) lote.delete(d.ref);
  for (const d of presentes.docs) lote.delete(d.ref);
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
 * um link e uma mensagem pendente novos por participante são criados e sorteios/atual é
 * regravado. Ou tudo, ou nada. Depois que uma mensagem foi enviada, recusa com ENVIO_INICIADO e
 * nada muda. `baseUrl` é o endereço da página do link (`https://…/#/l/`), usado no texto das
 * mensagens.
 */
export async function gravarSorteio(
  db: Firestore,
  {
    sortearFn = sortear,
    gerarToken = gerarTokenPadrao,
    baseUrl = BASE_PADRAO,
  }: { sortearFn?: typeof sortear; gerarToken?: () => string; baseUrl?: string } = {},
): Promise<{ sorteioId: string; tokens: Map<string, string>; presentesOk: boolean }> {
  if (await envioIniciado(db)) throw new Error("ENVIO_INICIADO");
  const participantes = await lerParticipantes(db);
  const pares = sortearFn(participantes.map((p) => p.id));
  const sorteioId = gerarToken();
  const links = montarLinks(participantes, pares, sorteioId, gerarToken);
  const tokens = new Map(links.map((l) => [l.participanteId, l.token]));
  const mensagens = gerarMensagens(participantes, tokens, baseUrl);

  const lote = writeBatch(db);
  const mensagensAntigas = await getDocs(collection(db, "mensagens"));
  for (const d of mensagensAntigas.docs) lote.delete(d.ref);
  const antigos = await getDocs(collection(db, "links"));
  for (const antigo of antigos.docs) lote.delete(antigo.ref);
  for (const antigo of (await getDocs(collection(db, "presentes"))).docs) lote.delete(antigo.ref);
  for (const { token, ...link } of links) lote.set(doc(db, "links", token), link);
  for (const { participanteId, ...resto } of mensagens)
    lote.set(doc(db, "mensagens", participanteId), { ...resto, atualizadoEm: serverTimestamp() });
  lote.set(doc(db, "sorteios", "atual"), { id: sorteioId, criadoEm: serverTimestamp(), enviosIniciados: false });
  await lote.commit();

  // Os presentes (D-005) são refeitos à parte, em commits pequenos: os links já valem se falhar.
  let presentesOk = true;
  try {
    await sincronizarPresentes(db);
  } catch {
    presentesOk = false;
  }
  return { sorteioId, tokens, presentesOk };
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

export interface MensagemGravada {
  token: string;
  whatsapp: string;
  texto: string;
  status: StatusDaMensagem;
}

/** Só "enviada" e "falha" são status conhecidos além de pendente; qualquer outro valor é pendente. */
function statusConhecido(valor: unknown): StatusDaMensagem {
  return valor === "enviada" || valor === "falha" ? valor : "pendente";
}

/** Lê as mensagens gravadas: participanteId → mensagem. Só o organizador consegue. */
export async function lerMensagens(db: Firestore): Promise<Map<string, MensagemGravada>> {
  const todas = await getDocs(collection(db, "mensagens"));
  return new Map(
    todas.docs.map((d) => {
      const v = d.data() as { token?: string; whatsapp?: string; texto?: string; status?: unknown };
      return [d.id, { token: v.token ?? "", whatsapp: v.whatsapp ?? "", texto: v.texto ?? "", status: statusConhecido(v.status) }];
    }),
  );
}

/**
 * Marca uma mensagem como enviada. Só grava se o link ainda existe (e é desse participante); senão
 * lança SORTEIO_MUDOU e nada é criado. Se a mensagem não existe (sorteio feito antes das mensagens
 * serem gravadas), cria a mensagem completa já como enviada.
 */
export async function marcarEnviada(
  db: Firestore,
  mensagem: { participanteId: string; token: string; whatsapp: string; texto: string },
): Promise<void> {
  const link = await getDoc(doc(db, "links", mensagem.token));
  if (!link.exists() || (link.data() as { participanteId?: string }).participanteId !== mensagem.participanteId)
    throw new Error("SORTEIO_MUDOU");
  const ref = doc(db, "mensagens", mensagem.participanteId);
  if ((await getDoc(ref)).exists()) {
    await updateDoc(ref, { status: "enviada", atualizadoEm: serverTimestamp() });
  } else {
    const { token, whatsapp, texto } = mensagem;
    await setDoc(ref, { token, whatsapp, texto, status: "enviada", atualizadoEm: serverTimestamp() });
  }
}

/**
 * Volta uma mensagem enviada para pendente. Se não existir ou não estiver enviada, lança
 * SORTEIO_MUDOU. Desfazer a única enviada solta a trava do novo sorteio e da reimportação.
 */
export async function desfazerEnvio(db: Firestore, participanteId: string): Promise<void> {
  const ref = doc(db, "mensagens", participanteId);
  const atual = await getDoc(ref);
  if (!atual.exists() || (atual.data() as { status?: unknown }).status !== "enviada") throw new Error("SORTEIO_MUDOU");
  await updateDoc(ref, { status: "pendente", atualizadoEm: serverTimestamp() });
}

/**
 * Lê a lista de presentes de quem a pessoa tirou, pelo token do link dela. Devolve os itens, ou
 * null se não há documento (sem lista). Erro de leitura é propagado: quem chama decide mostrar a
 * falha, nunca o aviso de "sem lista".
 */
export async function lerPresente(db: Firestore, token: string): Promise<string[] | null> {
  const presente = await getDoc(doc(db, "presentes", token));
  if (!presente.exists()) return null;
  const { itens } = presente.data() as { itens?: string[] };
  return Array.isArray(itens) ? itens : null;
}

/**
 * Grava a lista de presentes de uma pessoa, ligada ao nome dela (FR-004), e o documento `presentes`
 * de quem a tirou, num commit só (D-005). Texto sem itens apaga os dois. Fora do limite, recusa sem
 * gravar, com o código do erro (e a linha, no item longo). Sem sorteio, grava só a lista. Lê os
 * links do servidor: sem conseguir, falha antes de gravar qualquer coisa.
 */
export async function gravarLista(db: Firestore, nome: string, texto: string): Promise<void> {
  const lida = lerLista(texto);
  if (!lida.ok) throw Object.assign(new Error(lida.codigo), { linha: lida.codigo === "LISTA_ITEM_LONGO" ? lida.linha : undefined });
  const id = chaveDaLista(nome);
  const links = await getDocsFromServer(collection(db, "links"));
  const quemTirou = links.docs.find((d) => {
    const { amigo } = d.data() as { amigo?: string };
    return typeof amigo === "string" && chaveDaLista(amigo) === id;
  });
  const lote = writeBatch(db);
  if (lida.itens.length === 0) {
    lote.delete(doc(db, "listas", id));
    if (quemTirou) lote.delete(doc(db, "presentes", quemTirou.id));
  } else {
    lote.set(doc(db, "listas", id), { nome: nome.trim(), itens: lida.itens, atualizadoEm: Timestamp.now() });
    if (quemTirou) lote.set(doc(db, "presentes", quemTirou.id), { itens: lida.itens, atualizadoEm: Timestamp.now() });
  }
  await lote.commit();
}

/** As listas guardadas: chave do nome → itens. Só o organizador lê. */
export async function lerListas(db: Firestore): Promise<Map<string, string[]>> {
  const todas = await getDocs(collection(db, "listas"));
  return new Map(
    todas.docs.map((d) => {
      const { itens } = d.data() as { itens?: string[] };
      return [d.id, Array.isArray(itens) ? itens : []] as const;
    }),
  );
}

/** Operações por commit da sincronização dos presentes (o limite do Firestore é 500). */
const OPERACOES_POR_COMMIT = 200;

/**
 * Refaz os documentos `presentes` a partir dos links e das listas (D-005): cria ou corrige o que
 * falta ou mudou e apaga o que não tem mais link ou lista. É idempotente, só mexe em `presentes` e
 * grava em commits de até 200 operações.
 */
export async function sincronizarPresentes(db: Firestore): Promise<void> {
  const [links, listas, presentes] = await Promise.all([
    getDocs(collection(db, "links")),
    lerListas(db),
    getDocs(collection(db, "presentes")),
  ]);
  const desejados = new Map<string, string[]>();
  for (const l of links.docs) {
    const { amigo } = l.data() as { amigo?: string };
    const itens = typeof amigo === "string" ? listas.get(chaveDaLista(amigo)) : undefined;
    if (itens && itens.length > 0) desejados.set(l.id, itens);
  }
  const operacoes: ((lote: ReturnType<typeof writeBatch>) => void)[] = [];
  for (const [token, itens] of desejados) {
    const atual = presentes.docs.find((d) => d.id === token)?.data() as { itens?: string[] } | undefined;
    if (!atual || JSON.stringify(atual.itens) !== JSON.stringify(itens))
      operacoes.push((lote) => lote.set(doc(db, "presentes", token), { itens, atualizadoEm: Timestamp.now() }));
  }
  for (const d of presentes.docs) if (!desejados.has(d.id)) operacoes.push((lote) => lote.delete(d.ref));
  for (let i = 0; i < operacoes.length; i += OPERACOES_POR_COMMIT) {
    const lote = writeBatch(db);
    for (const op of operacoes.slice(i, i + OPERACOES_POR_COMMIT)) op(lote);
    await lote.commit();
  }
}
