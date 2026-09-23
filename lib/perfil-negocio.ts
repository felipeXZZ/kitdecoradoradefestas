import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/** Perfil do negócio: preenchido uma vez, usado em todo orçamento e documento. */
export type PerfilNegocio = {
  email: string;
  nome_negocio: string | null;
  nome_responsavel: string | null;
  telefone: string | null;
  cidade: string | null;
  documento: string | null;
  logo_path: string | null;
  validade_padrao_dias: number;
  percentual_sinal: number;
  condicoes_padrao: string | null;
};

export const PERFIL_VAZIO: Omit<PerfilNegocio, "email"> = {
  nome_negocio: null,
  nome_responsavel: null,
  telefone: null,
  cidade: null,
  documento: null,
  logo_path: null,
  validade_padrao_dias: 7,
  percentual_sinal: 50,
  condicoes_padrao: null,
};

export const BUCKET_LOGOS = "logos";

const CAMPOS =
  "email, nome_negocio, nome_responsavel, telefone, cidade, documento, logo_path, validade_padrao_dias, percentual_sinal, condicoes_padrao";

export async function getPerfilNegocio(email: string): Promise<PerfilNegocio> {
  const { data, error } = await createAdminClient()
    .from("perfil_negocio")
    .select(CAMPOS)
    .eq("email", email)
    .maybeSingle();

  if (error) console.error("[perfil] ler", error.message);
  return (data as PerfilNegocio | null) ?? { email, ...PERFIL_VAZIO };
}

/** Perfil serve para gerar documento? Sem nome do negócio, o PDF sai sem cabeçalho. */
export function perfilCompleto(perfil: PerfilNegocio) {
  return Boolean(perfil.nome_negocio?.trim());
}

/** Pasta do arquivo sem expor o e-mail no caminho. */
export function pastaDoEmail(email: string) {
  return createHash("sha256").update(email).digest("hex").slice(0, 16);
}

/** URL assinada para mostrar a logo na tela (o bucket é privado). */
export async function urlDaLogo(logo_path: string | null, segundos = 3600) {
  if (!logo_path) return null;
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET_LOGOS)
    .createSignedUrl(logo_path, segundos);
  if (error) {
    console.warn("[perfil] url da logo", error.message);
    return null;
  }
  return data.signedUrl;
}
