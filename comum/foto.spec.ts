import { expect, it } from "vitest";
import { fotoValida } from "./foto";

it("aceita uma foto JPEG ou PNG em data URL de tamanho razoável", () => {
  expect(fotoValida("data:image/jpeg;base64," + "A".repeat(1000))).toBe(true);
  expect(fotoValida("data:image/png;base64," + "A".repeat(1000))).toBe(true);
});

it("recusa o que não é imagem em data URL, e foto grande demais para um documento do banco", () => {
  expect(fotoValida("")).toBe(false);
  expect(fotoValida("https://exemplo.test/foto.jpg")).toBe(false);
  expect(fotoValida("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
  expect(fotoValida("data:image/jpeg;base64," + "A".repeat(700_001))).toBe(false);
});
