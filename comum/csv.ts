import { normalizarWhatsapp } from "./whatsapp";

export interface LinhaParticipante {
  nome: string;
  whatsapp: string;
  responsavel: string | null;
}

/** Tira acentos e caixa para comparar nomes de coluna ("Responsável" = "responsavel"). */
function chave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** Divide uma linha em campos, respeitando aspas ("a; b" é um campo só, "" é uma aspa). */
function campos(linha: string, separador: string): string[] {
  const saida: string[] = [];
  let atual = "";
  let entreAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (entreAspas) {
      if (c === '"' && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (c === '"') {
        entreAspas = false;
      } else {
        atual += c;
      }
    } else if (c === '"') {
      entreAspas = true;
    } else if (c === separador) {
      saida.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  saida.push(atual);
  return saida.map((s) => s.trim());
}

/**
 * Lê a planilha da família (CSV com cabeçalho nome, whatsapp e, opcional, responsavel).
 * Aceita "," ou ";", BOM, CRLF, linhas vazias e campos entre aspas. Mantém a ordem.
 * Lança Error("CABECALHO") se faltar a coluna nome ou whatsapp.
 */
export function lerCsv(texto: string): LinhaParticipante[] {
  const linhas = texto
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (linhas.length === 0) return [];

  const cabecalho = linhas[0];
  const separador = (cabecalho.match(/;/g)?.length ?? 0) > (cabecalho.match(/,/g)?.length ?? 0) ? ";" : ",";
  const colunas = campos(cabecalho, separador).map(chave);
  const iNome = colunas.indexOf("nome");
  const iWhatsapp = colunas.indexOf("whatsapp");
  const iResponsavel = colunas.indexOf("responsavel");
  if (iNome < 0 || iWhatsapp < 0) throw new Error("CABECALHO");

  return linhas.slice(1).map((linha) => {
    const c = campos(linha, separador);
    const responsavel = iResponsavel >= 0 ? (c[iResponsavel] ?? "") : "";
    return {
      nome: c[iNome] ?? "",
      whatsapp: normalizarWhatsapp(c[iWhatsapp] ?? ""),
      responsavel: responsavel === "" ? null : responsavel,
    };
  });
}
