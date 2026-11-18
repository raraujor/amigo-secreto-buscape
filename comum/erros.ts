/**
 * Texto para o organizador a partir do código de um erro. Qualquer erro desconhecido (por
 * exemplo, permissão negada do banco) mostra só um texto genérico, sem repetir nomes nem números.
 */
export function mensagemDeErro(codigo: string, acao: "sortear" | "importar" = "sortear"): string {
  switch (codigo) {
    case "MINIMO_DOIS":
      return "São precisos ao menos 2 participantes para sortear.";
    case "ENVIO_INICIADO":
      return acao === "importar"
        ? "Os links já saíram, então não dá para importar outra lista."
        : "Os links já saíram, então não dá para sortear de novo.";
    case "ENVIO_INDEFINIDO":
      return "Não foi possível conferir se os links já saíram. Tente de novo.";
    default:
      return "Não foi possível concluir. Tente de novo.";
  }
}
