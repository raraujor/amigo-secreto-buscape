/**
 * Mensagem do WhatsApp com o link de um participante. Quem tem responsável (por exemplo, uma
 * criança sem WhatsApp) tem o link enviado ao responsável, dizendo de quem é.
 */
export function montarMensagem(participante: { nome: string; responsavel: string | null }, url: string): string {
  if (participante.responsavel) {
    return `Oi ${participante.responsavel}, este é o link do amigo secreto de ${participante.nome}: ${url}`;
  }
  return `Oi ${participante.nome}, este é o seu link do amigo secreto: ${url}`;
}

/** Link wa.me que abre o WhatsApp na conversa com o número, já com o texto pronto. */
export function linkWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}
