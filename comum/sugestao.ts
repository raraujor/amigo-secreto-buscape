export type EstadoDaSugestao =
  | { tipo: "lista"; itens: string[] }
  | { tipo: "aviso"; texto: string }
  | { tipo: "falha"; texto: string };

/**
 * O que a página do link mostra da sugestão de presente de quem a pessoa tirou. Erro de leitura é
 * "falha", nunca "aviso"; documento inexistente ou sem itens é "aviso".
 */
export function estadoDaSugestao({
  nome,
  itens,
  falhou,
}: {
  nome: string;
  itens: readonly string[] | null;
  falhou: boolean;
}): EstadoDaSugestao {
  if (falhou)
    return { tipo: "falha", texto: "Não foi possível carregar a sugestão agora. Recarregue a página para tentar de novo." };
  if (itens === null || itens.length === 0)
    return { tipo: "aviso", texto: `A sugestão de presente de ${nome} ainda não está disponível. Volte depois.` };
  return { tipo: "lista", itens: [...itens] };
}
