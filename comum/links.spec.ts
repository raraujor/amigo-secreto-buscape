import { describe, expect, it } from "vitest";
import { montarLinks } from "./links";

describe("montarLinks", () => {
  it("US6 FR-007 cada participante recebe um link com o seu amigo, o sorteioId e abertoEm nulo", () => {
    const participantes = [
      { id: "a", nome: "Ana" },
      { id: "b", nome: "Bruno" },
      { id: "c", nome: "Carla" },
    ];
    const pares = new Map([
      ["a", "b"],
      ["b", "c"],
      ["c", "a"],
    ]);
    let n = 0;
    const links = montarLinks(participantes, pares, "sorteio-1", () => `token-${++n}`);

    expect(links).toEqual([
      { token: "token-1", participanteId: "a", participante: "Ana", amigo: "Bruno", sorteioId: "sorteio-1", abertoEm: null },
      { token: "token-2", participanteId: "b", participante: "Bruno", amigo: "Carla", sorteioId: "sorteio-1", abertoEm: null },
      { token: "token-3", participanteId: "c", participante: "Carla", amigo: "Ana", sorteioId: "sorteio-1", abertoEm: null },
    ]);
  });
});
