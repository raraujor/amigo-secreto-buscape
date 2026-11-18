export type EstadoDaPaginaDoLink =
  | { tipo: "invalido"; texto: string }
  | { tipo: "fechado"; titulo: string; botao: string }
  | { tipo: "aberto"; texto: string };

/**
 * O que a página do link mostra. Antes do toque em "Ver quem eu tirei", só de quem é o link;
 * o nome do amigo só aparece depois. Link inexistente: mensagem sem nenhum nome.
 */
export function estadoDaPaginaDoLink(
  link: { participante: string; amigo: string } | null,
  revelado: boolean,
): EstadoDaPaginaDoLink {
  if (link === null) return { tipo: "invalido", texto: "Link inválido, fale com o organizador." };
  if (!revelado) return { tipo: "fechado", titulo: `Link de ${link.participante}`, botao: "Ver quem eu tirei" };
  return { tipo: "aberto", texto: `${link.participante}, você tirou: ${link.amigo}` };
}
