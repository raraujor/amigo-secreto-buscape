import { expect, it } from "vitest";
import {
  gerarMensagens,
  linkWhatsapp,
  montarMensagem,
  resumoDeEnvio,
  rotuloDoStatus,
  textoDaMensagem,
} from "./mensagens";

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

const BASE = "https://exemplo.test/#/l/";
const NUMERO_DA_MARIA = "5534999990000";
const pessoa = (id: string, nome: string, whatsapp: string, responsavel: string | null = null) => ({ id, nome, whatsapp, responsavel });

it("US6 FR-008 Maria, João e Laura no número de Maria têm três mensagens com os textos exatos", () => {
  const participantes = [
    pessoa("m", "Maria", NUMERO_DA_MARIA),
    pessoa("j", "João", NUMERO_DA_MARIA, "Maria"),
    pessoa("l", "Laura", NUMERO_DA_MARIA, "Maria"),
  ];
  const tokens = new Map([["m", "tk-maria"], ["j", "tk-joao"], ["l", "tk-laura"]]);
  const mensagens = gerarMensagens(participantes, tokens, BASE);
  expect(mensagens.map((m) => m.texto)).toEqual([
    `Oi Maria, este é o seu link do amigo secreto: ${BASE}tk-maria`,
    `Oi Maria, este é o link do amigo secreto de João: ${BASE}tk-joao`,
    `Oi Maria, este é o link do amigo secreto de Laura: ${BASE}tk-laura`,
  ]);
  expect(mensagens.every((m) => m.whatsapp === NUMERO_DA_MARIA)).toBe(true);
});

it("US6 FR-008 Ana sem responsável recebe a mensagem dirigida a ela", () => {
  const [mensagem] = gerarMensagens([pessoa("a", "Ana", "5534988880000")], new Map([["a", "tk-ana"]]), BASE);
  expect(mensagem.texto).toBe(`Oi Ana, este é o seu link do amigo secreto: ${BASE}tk-ana`);
});

it("US6 FR-007 FR-008 NFR-005 cada mensagem leva o link com o token da própria pessoa e começa pendente", () => {
  const participantes = [pessoa("a", "Ana", "5534988880001"), pessoa("b", "Bia", "5534988880002")];
  const mensagens = gerarMensagens(participantes, new Map([["a", "token-da-ana"], ["b", "token-da-bia"]]), BASE);
  expect(mensagens).toEqual([
    expect.objectContaining({ participanteId: "a", token: "token-da-ana", status: "pendente" }),
    expect.objectContaining({ participanteId: "b", token: "token-da-bia", status: "pendente" }),
  ]);
  expect(mensagens[0].texto).toContain(`${BASE}token-da-ana`);
  expect(mensagens[0].texto).not.toContain("token-da-bia");
  expect(mensagens[1].texto).toContain(`${BASE}token-da-bia`);
});

it("US6 FR-008 o número da mensagem é o da linha do participante, não o do responsável pelo nome", () => {
  const participantes = [pessoa("m", "Maria", "5534900000001"), pessoa("j", "João", "5534900000002", "Maria")];
  const mensagens = gerarMensagens(participantes, new Map([["m", "a"], ["j", "b"]]), BASE);
  expect(mensagens[1].whatsapp).toBe("5534900000002");
});

it("US10 FR-008 mãe com dois filhos recebe duas mensagens, cada uma diz de quem é o link", () => {
  const participantes = [
    pessoa("l", "Luís", NUMERO_DA_MARIA, "Pedro"),
    pessoa("a", "Ana", NUMERO_DA_MARIA, "Pedro"),
  ];
  const mensagens = gerarMensagens(participantes, new Map([["l", "tk-luis"], ["a", "tk-ana"]]), BASE);
  expect(mensagens.map((m) => m.whatsapp)).toEqual([NUMERO_DA_MARIA, NUMERO_DA_MARIA]);
  expect(mensagens[0].texto).toBe(`Oi Pedro, este é o link do amigo secreto de Luís: ${BASE}tk-luis`);
  expect(mensagens[1].texto).toBe(`Oi Pedro, este é o link do amigo secreto de Ana: ${BASE}tk-ana`);
});

it("US8 FR-010 o link do WhatsApp abre a conversa com o número da linha e o texto pronto", () => {
  const [mensagem] = gerarMensagens([pessoa("a", "Ana", "+55 (34) 98888-0000")], new Map([["a", "tk"]]), BASE);
  const link = linkWhatsapp(mensagem.whatsapp, mensagem.texto);
  expect(link.startsWith("https://wa.me/5534988880000?text=")).toBe(true);
  expect(decodeURIComponent(link.split("?text=")[1])).toBe(mensagem.texto);
});

it("US8 FR-010 sem mensagem gravada o texto montado na hora é igual ao gravado", () => {
  const participante = pessoa("j", "João", NUMERO_DA_MARIA, "Maria");
  const [gravada] = gerarMensagens([participante], new Map([["j", "tk"]]), BASE);
  expect(textoDaMensagem(gravada, participante, `${BASE}tk`)).toBe(gravada.texto);
  expect(textoDaMensagem(undefined, participante, `${BASE}tk`)).toBe(gravada.texto);
});

it("US7 FR-009 cada status aparece como pendente, enviada ou com falha", () => {
  expect(rotuloDoStatus("pendente")).toBe("Pendente");
  expect(rotuloDoStatus("enviada")).toBe("✓ Enviada");
  expect(rotuloDoStatus("falha")).toBe("⚠ Com falha");
  expect(rotuloDoStatus("qualquer-coisa")).toBe("Pendente");
  expect(rotuloDoStatus(undefined)).toBe("Pendente");
});

it("US7 FR-009 o resumo de envio diz nenhuma, 1 enviada ou N enviadas", () => {
  expect(resumoDeEnvio(0)).toBe("");
  expect(resumoDeEnvio(1)).toBe("1 enviada");
  expect(resumoDeEnvio(12)).toBe("12 enviadas");
});
