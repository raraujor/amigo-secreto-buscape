export interface Link {
  token: string;
  participanteId: string;
  participante: string;
  amigo: string;
  sorteioId: string;
  abertoEm: null;
}

/** Monta um link por participante a partir do resultado do sorteio (id → id do amigo). */
export function montarLinks(
  participantes: readonly { id: string; nome: string }[],
  pares: ReadonlyMap<string, string>,
  sorteioId: string,
  gerarToken: () => string,
): Link[] {
  const nomePorId = new Map(participantes.map((p) => [p.id, p.nome]));
  return participantes.map((p) => {
    const amigoId = pares.get(p.id);
    const amigo = amigoId === undefined ? undefined : nomePorId.get(amigoId);
    if (amigo === undefined) throw new Error(`SEM_AMIGO:${p.id}`);
    return { token: gerarToken(), participanteId: p.id, participante: p.nome, amigo, sorteioId, abertoEm: null };
  });
}
