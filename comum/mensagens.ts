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

export type StatusDaMensagem = "pendente" | "enviada" | "falha";

/** Uma mensagem pronta para o WhatsApp, como fica gravada em `mensagens/{participanteId}`. */
export interface Mensagem {
  participanteId: string;
  token: string;
  /** O número da linha do participante (para uma criança, o do responsável). */
  whatsapp: string;
  texto: string;
  status: StatusDaMensagem;
}

/**
 * Uma mensagem por participante, na ordem da lista: o texto de `montarMensagem` com o link
 * `baseUrl + token`, o número da própria linha e o status pendente. `tokens` vai do id do
 * participante ao token do seu link.
 */
export function gerarMensagens(
  participantes: readonly { id: string; nome: string; whatsapp: string; responsavel: string | null }[],
  tokens: ReadonlyMap<string, string>,
  baseUrl: string,
): Mensagem[] {
  return participantes.map((p) => {
    const token = tokens.get(p.id);
    if (token === undefined) throw new Error(`SEM_TOKEN:${p.id}`);
    return {
      participanteId: p.id,
      token,
      whatsapp: p.whatsapp,
      texto: montarMensagem(p, `${baseUrl}${token}`),
      status: "pendente",
    };
  });
}

/**
 * O texto da mensagem para o botão do WhatsApp: o que está gravado ou, num sorteio sem mensagens
 * gravadas (feito antes desta função existir), o mesmo texto montado na hora.
 */
export function textoDaMensagem(
  gravada: { texto: string } | undefined,
  participante: { nome: string; responsavel: string | null },
  url: string,
): string {
  return gravada?.texto ?? montarMensagem(participante, url);
}

/** "Pendente", "✓ Enviada" ou "⚠ Com falha"; qualquer outro valor, ou nenhum, é "Pendente". */
export function rotuloDoStatus(status: string | undefined): string {
  if (status === "enviada") return "✓ Enviada";
  if (status === "falha") return "⚠ Com falha";
  return "Pendente";
}

/** "" se nenhuma foi enviada, "1 enviada" ou "N enviadas". */
export function resumoDeEnvio(enviadas: number): string {
  if (enviadas <= 0) return "";
  return enviadas === 1 ? "1 enviada" : `${enviadas} enviadas`;
}
