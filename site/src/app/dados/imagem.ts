import { FOTO_MAX_CARACTERES } from "../../../../comum/foto";

/**
 * Reduz a foto no próprio navegador (lado maior de 720 px, JPEG) para caber no banco,
 * baixando a qualidade se ainda ficar grande. Devolve um data URL.
 */
export async function reduzirFoto(arquivo: File): Promise<string> {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, 720 / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  canvas.getContext("2d")?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  for (const qualidade of [0.85, 0.75, 0.65, 0.5]) {
    const url = canvas.toDataURL("image/jpeg", qualidade);
    if (url.length <= FOTO_MAX_CARACTERES) return url;
  }
  throw new Error("FOTO_GRANDE");
}
