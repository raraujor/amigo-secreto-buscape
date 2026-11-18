/**
 * Deixa só os dígitos do número; 10 ou 11 dígitos (DDD + número) ganham o 55 do Brasil. Um zero
 * à esquerda (o "0" que alguns escrevem antes do DDD, como em 034 99999-0000) sai quando o número
 * passa de 11 dígitos. O resto fica como está: a validação da planilha aponta o que não for
 * 55 + 10 ou 11 dígitos.
 */
export function normalizarWhatsapp(texto: string): string {
  const digitos = texto.replace(/\D/g, "");
  const semZero = digitos.length === 10 || digitos.length === 11 ? digitos : digitos.replace(/^0+/, "");
  return semZero.length === 10 || semZero.length === 11 ? `55${semZero}` : semZero;
}
