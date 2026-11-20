import { chaveDoNome } from "./planilha";

/** Limites de uma lista de presentes (FR-001, decisão do organizador na 2.3, Q3). */
export const MAX_ITENS = 20;
export const MAX_CARACTERES = 200;

export type ResultadoLista =
  | { ok: true; itens: string[] }
  | { ok: false; codigo: "LISTA_ITENS_DEMAIS" }
  | { ok: false; codigo: "LISTA_ITEM_LONGO"; linha: number };

/** Conta os caracteres como aparecem na tela: por grafema, ou por ponto de código sem Intl.Segmenter. */
function contarCaracteres(texto: string): number {
  const Segmenter = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: "grapheme" }) => { segment(t: string): Iterable<unknown> } }).Segmenter;
  if (Segmenter) {
    let n = 0;
    for (const _ of new Segmenter("pt-BR", { granularity: "grapheme" }).segment(texto)) n++;
    return n;
  }
  return Array.from(texto).length;
}

/**
 * Lê o texto da caixa de edição: um item por linha, linhas em branco ignoradas, espaços das pontas
 * tirados. Mais de 20 itens é recusado antes de qualquer item longo; um item de mais de 200
 * caracteres é recusado com o número da linha como foi digitada (contando as em branco).
 */
export function lerLista(texto: string): ResultadoLista {
  const linhas = texto.split(/\r\n|\r|\n/).map((l, i) => ({ texto: l.trim(), numero: i + 1 }));
  const itens = linhas.filter((l) => l.texto !== "");
  if (itens.length > MAX_ITENS) return { ok: false, codigo: "LISTA_ITENS_DEMAIS" };
  const longo = itens.find((l) => contarCaracteres(l.texto) > MAX_CARACTERES);
  if (longo) return { ok: false, codigo: "LISTA_ITEM_LONGO", linha: longo.numero };
  return { ok: true, itens: itens.map((l) => l.texto) };
}

/**
 * Chave do documento da lista, ligada ao nome da pessoa. O prefixo evita ids inválidos do Firestore
 * (".", "..", "__x__") e o NFC faz o "é" composto e o decomposto darem a mesma chave.
 */
export function chaveDaLista(nome: string): string {
  return `n_${encodeURIComponent(chaveDoNome(nome.normalize("NFC")))}`;
}

/** Os itens, um por linha, para preencher a caixa de edição. */
export function textoDaLista(itens: readonly string[]): string {
  return itens.join("\n");
}

/** "com lista" ou "sem lista" por participante; listas de nomes fora da planilha não entram. */
export function resumoDeListas(
  participantes: readonly { nome: string }[],
  listas: ReadonlySet<string>,
): { nome: string; comLista: boolean }[] {
  return participantes.map((p) => ({ nome: p.nome, comLista: listas.has(chaveDaLista(p.nome)) }));
}

/**
 * O texto que o organizador cola no WhatsApp: a lista salva de cada pessoa que tem lista, na ordem dos participantes,
 * sob um título único "Lista de presentes", cada uma com o nome e os itens numerados, separadas por uma linha em branco. Sem nenhuma lista, o texto é vazio.
 */
export function textoDeTodasAsListas(
  participantes: readonly { nome: string }[],
  listas: ReadonlyMap<string, readonly string[]>,
): string {
  const blocos: string[] = [];
  for (const { nome } of participantes) {
    const itens = listas.get(chaveDaLista(nome)) ?? [];
    if (itens.length === 0) continue;
    blocos.push([`${nome}:`, ...itens.map((item, i) => `${i + 1}. ${item}`)].join("\n"));
  }
  return blocos.length === 0 ? "" : ["Lista de presentes", ...blocos].join("\n\n");
}
