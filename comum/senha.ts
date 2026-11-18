/** Senha do organizador: ao menos 12 caracteres, com letra, número e símbolo (US1-AC6, NFR-007). */
export function senhaForte(senha: string): boolean {
  return (
    [...senha].length >= 12 &&
    /\p{L}/u.test(senha) &&
    /\p{N}/u.test(senha) &&
    /[^\p{L}\p{N}\s]/u.test(senha)
  );
}
