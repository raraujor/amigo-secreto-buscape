/**
 * Deixa só os dígitos do número; 10 ou 11 dígitos (DDD + número) ganham o 55 do Brasil.
 * As validações finas (número curto, inválido) são da unit/002.
 */
export function normalizarWhatsapp(texto: string): string {
  const digitos = texto.replace(/\D/g, "");
  return digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos;
}
