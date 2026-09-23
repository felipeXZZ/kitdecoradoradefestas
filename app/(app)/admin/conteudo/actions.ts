"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export type Resposta = { ok: true } | { ok: false; mensagem: string };

const CATEGORIAS = ["orcamento", "objecao", "sinal", "followup", "indicacao"];
const TIPOS = ["contrato", "termo", "recibo", "checklist"];

export async function salvarScript(d: {
  id?: string;
  categoria: string;
  titulo: string;
  corpo: string;
  ordem: number;
  ativo: boolean;
}): Promise<Resposta> {
  await exigirAdmin();
  if (!CATEGORIAS.includes(d.categoria)) return { ok: false, mensagem: "Categoria inválida." };
  if (!d.titulo.trim() || !d.corpo.trim()) return { ok: false, mensagem: "Preencha título e texto." };

  const registro = {
    categoria: d.categoria,
    titulo: d.titulo.trim().slice(0, 160),
    corpo: d.corpo.trim().slice(0, 4000),
    ordem: Math.trunc(d.ordem) || 0,
    ativo: d.ativo,
  };

  const admin = createAdminClient();
  const { error } = d.id
    ? await admin.from("scripts").update(registro).eq("id", d.id)
    : await admin.from("scripts").insert(registro);

  if (error) {
    console.error("[admin] script", error.message);
    return { ok: false, mensagem: "Não conseguimos salvar. Tente de novo." };
  }
  revalidatePath("/admin/conteudo");
  revalidatePath("/scripts");
  return { ok: true };
}

export async function excluirScript(id: string): Promise<Resposta> {
  await exigirAdmin();
  const { error } = await createAdminClient().from("scripts").delete().eq("id", id);
  if (error) return { ok: false, mensagem: error.message };
  revalidatePath("/admin/conteudo");
  revalidatePath("/scripts");
  return { ok: true };
}

/**
 * Contrato e termo só devem ser publicados com texto revisado por advogado.
 * O admin permite cadastrar, mas a tela avisa isso em cima do formulário.
 */
export async function salvarModelo(d: {
  tipo: string;
  titulo: string;
  descricao: string;
  corpo: string;
  ativo: boolean;
}): Promise<Resposta> {
  await exigirAdmin();
  if (!TIPOS.includes(d.tipo)) return { ok: false, mensagem: "Tipo inválido." };
  if (!d.titulo.trim() || !d.corpo.trim()) return { ok: false, mensagem: "Preencha título e texto." };

  const { error } = await createAdminClient()
    .from("documentos_modelo")
    .upsert(
      {
        tipo: d.tipo,
        titulo: d.titulo.trim().slice(0, 160),
        descricao: d.descricao.trim().slice(0, 300) || null,
        corpo: d.corpo.trim().slice(0, 20000),
        ativo: d.ativo,
      },
      { onConflict: "tipo" },
    );

  if (error) {
    console.error("[admin] modelo", error.message);
    return { ok: false, mensagem: "Não conseguimos salvar. Tente de novo." };
  }
  revalidatePath("/admin/conteudo");
  revalidatePath("/documentos");
  return { ok: true };
}
