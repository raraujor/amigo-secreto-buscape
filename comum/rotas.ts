export type Destino =
  | { tela: "entrar" }
  | { tela: "organizador"; acoes: ("importar" | "sortear")[] }
  | { tela: "link"; token: string };

/**
 * Para onde uma rota (o que vem depois de "#/") leva. A área do organizador exige login;
 * o link do participante é público.
 */
export function destinoDaRota(rota: string, logado: boolean): Destino {
  const link = /^l\/([A-Za-z0-9_-]+)$/.exec(rota);
  if (link) return { tela: "link", token: link[1] };
  if (!logado) return { tela: "entrar" };
  return { tela: "organizador", acoes: ["importar", "sortear"] };
}
