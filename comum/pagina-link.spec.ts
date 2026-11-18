import { expect, it } from "vitest";
import { estadoDaPaginaDoLink } from "./pagina-link";

const linkDeAna = { participante: "Ana", amigo: "Bruno" };

it("US9 FR-007 mostra o amigo só depois de Ver quem eu tirei", () => {
  const fechado = estadoDaPaginaDoLink(linkDeAna, false);
  expect(fechado).toEqual({ tipo: "fechado", titulo: "Ana, você saiu com...", botao: "Ver quem eu tirei" });
  expect(JSON.stringify(fechado)).not.toContain("Bruno");

  expect(estadoDaPaginaDoLink(linkDeAna, true)).toEqual({ tipo: "aberto", texto: "Ana, você saiu com: Bruno" });
});

it("US9 FR-007 identificador inexistente mostra link inválido sem nome", () => {
  const estado = estadoDaPaginaDoLink(null, true);
  expect(estado).toEqual({ tipo: "invalido", texto: "Link inválido, fale com o organizador." });
});

it("US9 FR-007 reabrir o mesmo link mostra o mesmo amigo", () => {
  const primeira = estadoDaPaginaDoLink(linkDeAna, true);
  const segunda = estadoDaPaginaDoLink(linkDeAna, true);
  expect(segunda).toEqual(primeira);
});

it("US10 FR-007 link aberto pelo responsável mostra de quem é o link antes do toque e nenhum nome sorteado", () => {
  const estado = estadoDaPaginaDoLink({ participante: "João", amigo: "Laura" }, false);
  expect(estado).toEqual({ tipo: "fechado", titulo: "João, você saiu com...", botao: "Ver quem eu tirei" });
  expect(JSON.stringify(estado)).not.toContain("Laura");
});
