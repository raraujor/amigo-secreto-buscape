/**
 * O resultado completo do sorteio em texto, com cabeçalho e uma linha por par ("Quem" e "Tirou"
 * separados por tabulação), pronto para colar numa planilha e conferir.
 */
export function resultadoEmTexto(pares: readonly { participante: string; amigo: string }[]): string {
  return ["Quem\tTirou", ...pares.map((p) => `${p.participante}\t${p.amigo}`)].join("\n");
}
