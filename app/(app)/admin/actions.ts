"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type DadosModulo = {
  id?: string;
  titulo: string;
  descricao: string;
  capa_url: string;
  contador: string;
  url_drive: string;
  plano_minimo: string;
  ordem: number;
  ativo: boolean;
  em_breve: boolean;
};

export type Resposta = { ok: true; id: string } | { ok: false; mensagem: string };

const BUCKET = "capas";
const EXTENSOES = new Set(["jpg", "jpeg", "png", "webp"]);

export async function salvarModulo(d: DadosModulo): Promise<Resposta> {
  await exigirAdmin();

  const titulo = d.titulo.trim();
  const url = d.url_drive.trim();
  if (!titulo) return { ok: false, mensagem: "Preencha o título." };
  // Módulo "em breve" ainda não tem pasta: a URL pode ficar vazia.
  if (!(d.em_breve && !url) && !/^https:\/\/\S+$/i.test(url)) {
    return { ok: false, mensagem: "A URL do Drive precisa começar com https://" };
  }
  if (d.plano_minimo !== "basico" && d.plano_minimo !== "completo") {
    return { ok: false, mensagem: "Plano mínimo inválido." };
  }

  const registro = {
    titulo: titulo.slice(0, 120),
    descricao: d.descricao.trim().slice(0, 300) || null,
    capa_url: d.capa_url.trim() || null,
    contador: d.contador.trim().slice(0, 40) || null,
    url_drive: url,
    plano_minimo: d.plano_minimo,
    ordem: Number.isFinite(d.ordem) ? Math.trunc(d.ordem) : 0,
    ativo: Boolean(d.ativo),
    em_breve: Boolean(d.em_breve),
  };

  const admin = createAdminClient();
  const consulta = d.id
    ? admin.from("modulos").update(registro).eq("id", d.id).select("id").single()
    : admin.from("modulos").insert(registro).select("id").single();
  const { data, error } = await consulta;

  if (error || !data) {
    console.error("[admin] salvar módulo", error?.message);
    return { ok: false, mensagem: "Não conseguimos salvar. Confira os campos e tente de novo." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true, id: data.id };
}

/** URL assinada para o navegador subir a capa direto no Storage, sem passar pelo servidor. */
export async function gerarUploadCapa(nomeArquivo: string) {
  await exigirAdmin();

  const ext = nomeArquivo.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSOES.has(ext)) return { ok: false as const, mensagem: "Use uma imagem JPG, PNG ou WebP." };

  const caminho = `${randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(caminho);
  if (error || !data) {
    console.error("[admin] upload capa", error?.message);
    return { ok: false as const, mensagem: "Não conseguimos preparar o envio da imagem." };
  }

  const publica = admin.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
  return { ok: true as const, caminho, token: data.token, urlPublica: publica };
}
