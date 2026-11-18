/** Maior foto aceita (em caracteres do data URL): cabe com folga no limite de 1 MiB de um documento. */
export const FOTO_MAX_CARACTERES = 700_000;

/** A foto da homenagem é uma imagem JPEG ou PNG em data URL, de tamanho razoável. */
export function fotoValida(fotoDataUrl: string): boolean {
  return /^data:image\/(jpeg|png);base64,/.test(fotoDataUrl) && fotoDataUrl.length <= FOTO_MAX_CARACTERES;
}
