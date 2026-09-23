const OBJETO_PUBLICO = "/storage/v1/object/public/";
const RENDER_PUBLICO = "/storage/v1/render/image/public/";

/**
 * Converte a URL pública de um arquivo do Supabase Storage na URL do transform
 * de imagem, na largura pedida. URLs de fora do Storage voltam como estão.
 */
export function urlImagem(url: string | null | undefined, largura: number, qualidade = 70) {
  if (!url) return null;
  if (!url.includes(OBJETO_PUBLICO)) return url;

  const [base] = url.split("?");
  const altura = Math.round((largura * 9) / 16);
  const params = new URLSearchParams({
    width: String(largura),
    height: String(altura),
    resize: "cover",
    quality: String(qualidade),
  });
  return `${base.replace(OBJETO_PUBLICO, RENDER_PUBLICO)}?${params}`;
}

export function srcSetImagem(url: string | null | undefined, larguras: number[]) {
  if (!url?.includes(OBJETO_PUBLICO)) return undefined;
  return larguras.map((l) => `${urlImagem(url, l)} ${l}w`).join(", ");
}
