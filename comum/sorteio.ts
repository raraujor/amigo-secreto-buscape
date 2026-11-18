/** Número em [0, 1) vindo de crypto.getRandomValues. */
export function aleatorioSeguro(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] / 4294967296;
}

/**
 * Sorteia o amigo secreto: devolve quem cada id tira.
 *
 * Gera uma permutação uniforme (Fisher-Yates) e a descarta se alguém tirar a si mesmo,
 * repetindo até dar certo (em média ~2,7 tentativas). Assim todos os sorteios válidos têm a
 * mesma chance, inclusive os com pares que se tiram mutuamente: saber o próprio amigo não
 * revela nada sobre os outros. Não há restrição de pares (FR-005).
 *
 * Lança Error("MINIMO_DOIS") com menos de 2 participantes.
 */
export function sortear(ids: readonly string[], aleatorio: () => number = aleatorioSeguro): Map<string, string> {
  if (ids.length < 2) throw new Error("MINIMO_DOIS");
  for (;;) {
    const alvo = [...ids];
    for (let i = alvo.length - 1; i > 0; i--) {
      const j = Math.floor(aleatorio() * (i + 1));
      [alvo[i], alvo[j]] = [alvo[j], alvo[i]];
    }
    if (alvo.every((quem, i) => quem !== ids[i])) {
      return new Map(ids.map((id, i) => [id, alvo[i]]));
    }
  }
}
