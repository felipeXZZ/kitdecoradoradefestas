// Variáveis públicas lidas em um lugar só. NEXT_PUBLIC_* é embutido no build,
// então precisa ser acessado pelo nome literal.

export const WHATSAPP_NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? "").replace(/\D/g, "");
export const CHECKOUT_UPGRADE_URL = process.env.NEXT_PUBLIC_CHECKOUT_UPGRADE_URL ?? "";
export const BANNER_NOVIDADE = (process.env.NEXT_PUBLIC_BANNER_NOVIDADE ?? "").trim();
export const BANNER_NOVIDADE_URL = process.env.NEXT_PUBLIC_BANNER_NOVIDADE_URL ?? "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function linkWhatsapp(mensagem = "Olá! Preciso de ajuda com o Kit da Decoradora.") {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
}
