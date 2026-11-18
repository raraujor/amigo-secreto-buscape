import { describe, expect, it } from "vitest";
import { sortear } from "./sorteio";

/** Gerador com semente fixa (mulberry32): testes determinísticos. */
function comSemente(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pessoas = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`);

function validar(ids: string[], pares: Map<string, string>) {
  expect(pares.size).toBe(ids.length);
  expect(new Set(pares.values()).size).toBe(ids.length);
  for (const id of ids) {
    expect(ids).toContain(pares.get(id));
    expect(pares.get(id)).not.toBe(id);
  }
}

describe("sortear", () => {
  it("US4 FR-004 37 participantes cada um tira um e é tirado uma vez", () => {
    const ids = pessoas(37);
    validar(ids, sortear(ids, comSemente(1)));
  });

  it("US4 FR-004 1000 sorteios de 2, 3 e 37 sem autossorteio", () => {
    const aleatorio = comSemente(2);
    for (const n of [2, 3, 37]) {
      const ids = pessoas(n);
      for (let i = 0; i < 1000; i++) validar(ids, sortear(ids, aleatorio));
    }
  });

  it("US4 FR-004 recusa 0 e 1 participante com MINIMO_DOIS", () => {
    expect(() => sortear([])).toThrow("MINIMO_DOIS");
    expect(() => sortear(["sozinho"])).toThrow("MINIMO_DOIS");
  });

  it("US4 FR-004 com 4 participantes e semente fixa os 9 sorteios válidos saem em 9000 com qui-quadrado abaixo de 26,12", () => {
    const ids = pessoas(4);
    const aleatorio = comSemente(3);
    const contagem = new Map<string, number>();
    for (let i = 0; i < 9000; i++) {
      const pares = sortear(ids, aleatorio);
      const chave = ids.map((id) => pares.get(id)).join(",");
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
    expect(contagem.size).toBe(9);
    const esperado = 1000;
    let quiQuadrado = 0;
    for (const observado of contagem.values()) quiQuadrado += (observado - esperado) ** 2 / esperado;
    // 8 graus de liberdade, p = 0,001.
    expect(quiQuadrado).toBeLessThan(26.12);
  });

  it("US4 FR-005 casal de dois participantes tira um ao outro", () => {
    const pares = sortear(["Ana", "Bruno"], comSemente(4));
    expect(pares.get("Ana")).toBe("Bruno");
    expect(pares.get("Bruno")).toBe("Ana");
  });

  it("US4 FR-005 com 37 participantes aparecem pares que se tiram mutuamente em 1000 sorteios", () => {
    const ids = pessoas(37);
    const aleatorio = comSemente(5);
    let comParMutuo = 0;
    for (let i = 0; i < 1000; i++) {
      const pares = sortear(ids, aleatorio);
      if (ids.some((id) => pares.get(pares.get(id) as string) === id)) comParMutuo++;
    }
    // Esperado ≈ 1 - e^(-1/2) ≈ 39%; um ciclo único daria 0.
    expect(comParMutuo).toBeGreaterThan(250);
  });

  it("usa o gerador seguro quando nenhum é passado", () => {
    validar(pessoas(5), sortear(pessoas(5)));
  });
});
