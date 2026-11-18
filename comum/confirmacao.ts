/**
 * Confirmação para recomeçar do zero: só a palavra RECOMEÇAR liga o botão. Não diferencia
 * maiúsculas, acentos nem espaços nas pontas (o teclado do celular costuma corrigir palavras).
 */
export function confirmouRecomecar(texto: string): boolean {
  const normalizado = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  return normalizado === "recomecar";
}
