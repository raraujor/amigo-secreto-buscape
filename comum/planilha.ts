import { type LinhaParticipante, lerCsv } from "./csv";

/** Cabem 80 pessoas num sorteio: um lote do banco aceita 500 operações, e cada pessoa pesa até 6. */
export const LIMITE_PESSOAS = 80;

const NUMERO_VALIDO = /^55\d{10,11}$/;

export interface ResultadoPlanilha {
  erros: string[];
  avisos: string[];
}

export interface Importacao extends ResultadoPlanilha {
  /** As linhas a importar; vazia se houver qualquer erro. */
  linhas: LinhaParticipante[];
}

/**
 * Decodifica os bytes de um CSV: UTF-8 e, se não for UTF-8 válido (o Excel em português salva em
 * Windows-1252), Windows-1252.
 */
export function decodificarCsv(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** "a", "a e b" ou "a, b e c". */
function listar(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** Compara nomes ignorando maiúsculas e espaços extras, mas não os acentos ("José" ≠ "Jose"). */
export function chaveDoNome(nome: string): string {
  return nome.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Confere a lista lida da planilha. Qualquer erro barra a importação; avisos não barram. A linha
 * n é a posição na lista mais 2 (o cabeçalho é a linha 1).
 */
export function analisarPlanilha(linhas: readonly LinhaParticipante[]): ResultadoPlanilha {
  const erros: string[] = [];
  const avisos: string[] = [];
  const numeroDaLinha = (i: number) => i + 2;

  linhas.forEach((linha, i) => {
    const n = numeroDaLinha(i);
    if (!linha.nome) erros.push(`Linha ${n}: falta o nome.`);
    if (!linha.whatsapp) erros.push(`Linha ${n}: falta o número de WhatsApp.`);
    else if (!NUMERO_VALIDO.test(linha.whatsapp))
      erros.push(`Linha ${n}: o número de ${linha.nome || "sem nome"} é inválido (${linha.whatsapp}).`);
  });

  const porNome = new Map<string, { nome: string; linhas: number[] }>();
  linhas.forEach((linha, i) => {
    if (!linha.nome) return;
    const chave = chaveDoNome(linha.nome);
    const grupo = porNome.get(chave) ?? { nome: linha.nome, linhas: [] };
    grupo.linhas.push(numeroDaLinha(i));
    porNome.set(chave, grupo);
  });
  for (const grupo of porNome.values())
    if (grupo.linhas.length > 1) erros.push(`Nome repetido: ${grupo.nome} (linhas ${listar(grupo.linhas.map(String))}).`);

  if (linhas.length > LIMITE_PESSOAS) erros.push(`A lista tem ${linhas.length} pessoas; o limite é ${LIMITE_PESSOAS}.`);

  const porNumero = new Map<string, { nome: string; linha: number }[]>();
  linhas.forEach((linha, i) => {
    if (!linha.whatsapp || linha.responsavel) return;
    const grupo = porNumero.get(linha.whatsapp) ?? [];
    grupo.push({ nome: linha.nome, linha: numeroDaLinha(i) });
    porNumero.set(linha.whatsapp, grupo);
  });
  for (const grupo of porNumero.values())
    if (grupo.length > 1)
      avisos.push(
        `Linhas ${listar(grupo.map((g) => String(g.linha)))}: ${listar(grupo.map((g) => g.nome))} usam o mesmo número e nenhuma tem responsável; a mensagem não dirá de quem é o link.`,
      );

  return { erros, avisos };
}

/**
 * Do arquivo à lista pronta para importar: decodifica, lê o CSV (com "," ou ";") e confere. Com
 * qualquer erro, `linhas` vem vazia, então nada com erro chega ao banco.
 */
export function prepararImportacao(bytes: Uint8Array): Importacao {
  let linhas: LinhaParticipante[];
  try {
    linhas = lerCsv(decodificarCsv(bytes));
  } catch {
    return {
      linhas: [],
      erros: ["A planilha precisa ter as colunas nome e whatsapp (e, se houver, responsavel)."],
      avisos: [],
    };
  }
  if (linhas.length === 0) return { linhas: [], erros: ["A planilha não tem nenhuma pessoa."], avisos: [] };
  const { erros, avisos } = analisarPlanilha(linhas);
  return { linhas: erros.length ? [] : linhas, erros, avisos };
}
