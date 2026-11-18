/** Identificador do link: 16 bytes aleatórios (128 bits) em base64url, 22 caracteres (NFR-005). */
export function gerarToken(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
