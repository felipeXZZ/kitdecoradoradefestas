"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { BUCKET_LOGOS, pastaDoEmail } from "@/lib/perfil-negocio";
import { exigirSessao } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";

export type DadosPerfil = {
  nome_negocio: string;
  nome_responsavel: string;
  telefone: string;
  cidade: string;
  documento: string;
  logo_path: string | null;
  validade_padrao_dias: number;
  percentual_sinal: number;
  condicoes_padrao: string;
};

export type Resposta = { ok: true } | { ok: false; mensagem: string };

const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Só o Kit Completo usa as ferramentas; a action confere de novo, não confia na tela. */
async function exigirCompleto() {
  const sessao = await exigirSessao();
  if (sessao.plano !== "completo") throw new Error("plano sem acesso");
  return sessao;
}

export async function salvarPerfil(d: DadosPerfil): Promise<Resposta> {
  const sessao = await exigirCompleto();

  const nome = d.nome_negocio.trim();
  if (!nome) return { ok: false, mensagem: "Preencha o nome do negócio." };

  const limite = (v: number, min: number, max: number, padrao: number) =>
    Number.isFinite(v) && v >= min && v <= max ? Math.trunc(v) : padrao;

  const { error } = await createAdminClient()
    .from("perfil_negocio")
    .upsert(
      {
        email: sessao.email,
        nome_negocio: nome.slice(0, 120),
        nome_responsavel: d.nome_responsavel.trim().slice(0, 120) || null,
        telefone: d.telefone.replace(/\D/g, "").slice(0, 13) || null,
        cidade: d.cidade.trim().slice(0, 120) || null,
        documento: d.documento.replace(/\D/g, "").slice(0, 14) || null,
        logo_path: d.logo_path,
        validade_padrao_dias: limite(d.validade_padrao_dias, 1, 90, 7),
        percentual_sinal: limite(d.percentual_sinal, 0, 100, 50),
        condicoes_padrao: d.condicoes_padrao.trim().slice(0, 2000) || null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

  if (error) {
    console.error("[perfil] salvar", error.message);
    return { ok: false, mensagem: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }

  revalidatePath("/meus-dados");
  return { ok: true };
}

/** URL assinada para o navegador subir a logo direto no Storage privado. */
export async function gerarUploadLogo(tipo: string) {
  const sessao = await exigirCompleto();

  const ext = EXTENSOES[tipo];
  if (!ext) return { ok: false as const, mensagem: "Use uma imagem JPG, PNG ou WebP." };

  const caminho = `${pastaDoEmail(sessao.email)}/${randomUUID()}.${ext}`;
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET_LOGOS)
    .createSignedUploadUrl(caminho);

  if (error || !data) {
    console.error("[perfil] upload logo", error?.message);
    return { ok: false as const, mensagem: "Não conseguimos preparar o envio da logo." };
  }

  return { ok: true as const, caminho, token: data.token };
}
