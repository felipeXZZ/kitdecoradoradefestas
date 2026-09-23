import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Plano } from "@/lib/tipos";

/**
 * MVP sem login: a cliente digita o e-mail da compra e o app grava um cookie
 * assinado com o e-mail e o plano. Sem senha, sem link por e-mail.
 *
 * A assinatura usa Web Crypto (HMAC-SHA256), que funciona tanto no servidor
 * quanto no proxy. Sem o segredo, ninguém forja um cookie de acesso.
 */

export const COOKIE_SESSAO = "kd_acesso";
const DIAS = 180;

export type Sessao = { email: string; plano: Plano; nome?: string | null };
type Conteudo = Sessao & { exp: number };

function segredo() {
  const s = process.env.SESSAO_SECRET || process.env.WEBHOOK_SECRET;
  if (!s) throw new Error("SESSAO_SECRET não configurada.");
  return s;
}

const b64 = {
  para: (texto: string) => Buffer.from(texto, "utf8").toString("base64url"),
  de: (dado: string) => Buffer.from(dado, "base64url").toString("utf8"),
};

async function assinar(dados: string) {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(dados));
  return Buffer.from(bytes).toString("base64url");
}

export async function criarValorCookie(sessao: Sessao) {
  const conteudo: Conteudo = { ...sessao, exp: Date.now() + DIAS * 86400_000 };
  const corpo = b64.para(JSON.stringify(conteudo));
  return `${corpo}.${await assinar(corpo)}`;
}

/** Devolve a sessão do cookie, ou null se estiver ausente, adulterada ou vencida. */
export async function lerValorCookie(valor: string | undefined): Promise<Sessao | null> {
  if (!valor) return null;
  const [corpo, assinatura] = valor.split(".");
  if (!corpo || !assinatura) return null;
  if ((await assinar(corpo)) !== assinatura) return null;

  try {
    const c = JSON.parse(b64.de(corpo)) as Conteudo;
    if (!c.email || c.exp < Date.now()) return null;
    return {
      email: c.email,
      plano: c.plano === "completo" ? "completo" : "basico",
      nome: c.nome ?? null,
    };
  } catch {
    return null;
  }
}

export const OPCOES_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DIAS * 86400,
};

/** Sessão atual em Server Component, action ou rota. */
export async function getSessao() {
  const store = await cookies();
  return lerValorCookie(store.get(COOKIE_SESSAO)?.value);
}

/** Igual, mas manda para a tela de entrada quem não tem acesso. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  return sessao;
}

/** Primeiro nome da compra; sem nome, a parte do e-mail antes do @. */
export function primeiroNome({ nome, email }: Pick<Sessao, "nome" | "email">) {
  return nome?.trim().split(/\s+/)[0] || email.split("@")[0] || "decoradora";
}
