import { expect, it } from "vitest";
import { linkWhatsapp, montarMensagem } from "./mensagens";

const url = "https://exemplo.test/#/l/AbCdEfGhIjKlMnOpQrStUv";

it("US6 FR-008 mensagem para quem tem WhatsApp fala com a própria pessoa", () => {
  expect(montarMensagem({ nome: "Maria", responsavel: null }, url)).toBe(
    `Oi Maria, este é o seu link do amigo secreto: ${url}`,
  );
});

it("US6 FR-008 mensagem de quem tem responsável fala com o responsável e diz de quem é o link", () => {
  expect(montarMensagem({ nome: "João", responsavel: "Maria" }, url)).toBe(
    `Oi Maria, este é o link do amigo secreto de João: ${url}`,
  );
});

it("US6 FR-008 link do WhatsApp usa só os dígitos do número e leva o texto codificado", () => {
  const link = linkWhatsapp("+55 (34) 99999-0000", "Oi Maria, tudo bem? É o link: https://x.test/#/l/a b");
  expect(link).toBe(
    "https://wa.me/5534999990000?text=Oi%20Maria%2C%20tudo%20bem%3F%20%C3%89%20o%20link%3A%20https%3A%2F%2Fx.test%2F%23%2Fl%2Fa%20b",
  );
});

it("US6 FR-008 nome com acento, E comercial e cerquilha no texto não quebra o link do WhatsApp", () => {
  const texto = montarMensagem({ nome: "José & Maria #1", responsavel: null }, url);
  const link = linkWhatsapp("5534999990000", texto);
  expect(link).not.toMatch(/[&#](?!.*\?text=)/);
  const codificado = link.split("?text=")[1];
  expect(codificado).not.toContain("&");
  expect(codificado).not.toContain("#");
  expect(decodeURIComponent(codificado)).toBe(texto);
});
