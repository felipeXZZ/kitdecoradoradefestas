"use server";

import { revalidatePath } from "next/cache";
import {
  gerarPdfOrcamento,
  linkAssinado,
  obterOrcamento,
  reservarNumero,
  type Orcamento,
  type StatusOrcamento,
} from "@/lib/orcamentos";
import { getPerfilNegocio } from "@/lib/perfil-negocio";
import { exigirSessao } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";

export type ItemNovo = { descricao: string; quantidade: number };

export type DadosNovoOrcamento = {
  cliente_nome: string;
  cliente_telefone: string;
  data_festa: string;
  local_festa: string;
  projeto_id: string;
  projeto_titulo: string;
  itens: ItemNovo[];
  valor_total: number;
  percentual_sinal: number;
  validade_dias: number;
  condicoes: string;
};

export type RespostaOrcamento =
  | { ok: true; id: string; link: string | null }
  | { ok: false; mensagem: string };

async function exigirCompleto() {
  const sessao = await exigirSessao();
  if (sessao.plano !== "completo") throw new Error("plano sem acesso");
  return sessao;
}

export async function criarOrcamento(d: DadosNovoOrcamento): Promise<RespostaOrcamento> {
  const sessao = await exigirCompleto();

  const nome = d.cliente_nome.trim();
  if (!nome) return { ok: false, mensagem: "Preencha o nome do cliente." };
  if (!(d.valor_total > 0)) return { ok: false, mensagem: "Informe o valor do orçamento." };

  const admin = createAdminClient();
  const perfil = await getPerfilNegocio(sessao.email);

  const percentual = Math.min(100, Math.max(0, Math.round(d.percentual_sinal)));
  const dias = Math.min(90, Math.max(1, Math.round(d.validade_dias) || perfil.validade_padrao_dias));
  const validade = new Date(Date.now() + dias * 86400_000).toISOString().slice(0, 10);
  const centavos = (v: number) => Math.round(v * 100) / 100;

  const itens = d.itens
    .map((i) => ({ descricao: i.descricao.trim().slice(0, 200), quantidade: Number(i.quantidade) || 1 }))
    .filter((i) => i.descricao);

  let numero: number;
  try {
    numero = await reservarNumero(sessao.email);
  } catch (e) {
    console.error("[orcamentos]", e);
    return { ok: false, mensagem: "Não conseguimos gerar o número do orçamento. Tente de novo." };
  }

  const registro = {
    email: sessao.email,
    numero,
    cliente_nome: nome.slice(0, 120),
    cliente_telefone: d.cliente_telefone.replace(/\D/g, "").slice(0, 11) || null,
    data_festa: d.data_festa || null,
    local_festa: d.local_festa.trim().slice(0, 200) || null,
    projeto_id: d.projeto_id || null,
    projeto_titulo: d.projeto_titulo.trim().slice(0, 200) || null,
    itens,
    valor_total: centavos(d.valor_total),
    valor_sinal: centavos((d.valor_total * percentual) / 100),
    validade,
    condicoes: d.condicoes.trim().slice(0, 2000) || perfil.condicoes_padrao,
  };

  const { data, error } = await admin.from("orcamentos").insert(registro).select("id").single();
  if (error || !data) {
    console.error("[orcamentos] salvar", error?.message);
    return { ok: false, mensagem: "Não conseguimos salvar o orçamento. Tente de novo." };
  }

  const link = await montarPdf(sessao.email, data.id);
  revalidatePath("/orcamentos");
  return { ok: true, id: data.id, link };
}

/** Gera (ou regenera) o PDF e devolve o link assinado. */
export async function montarPdf(email: string, id: string) {
  const orcamento = await obterOrcamento(email, id);
  if (!orcamento) return null;

  try {
    const caminho = await gerarPdfOrcamento(email, orcamento as Orcamento);
    await createAdminClient().from("orcamentos").update({ pdf_path: caminho }).eq("id", id);
    return await linkAssinado(caminho);
  } catch (e) {
    console.error("[orcamentos] pdf", e);
    return null;
  }
}

/** Link novo para um orçamento já salvo (o assinado expira em 7 dias). */
export async function linkDoOrcamento(id: string): Promise<string | null> {
  const sessao = await exigirCompleto();
  const orcamento = await obterOrcamento(sessao.email, id);
  if (!orcamento) return null;
  if (orcamento.pdf_path) {
    const link = await linkAssinado(orcamento.pdf_path);
    if (link) return link;
  }
  return montarPdf(sessao.email, id);
}

export async function mudarStatus(id: string, status: StatusOrcamento) {
  const sessao = await exigirCompleto();
  const { error } = await createAdminClient()
    .from("orcamentos")
    .update({ status })
    .eq("email", sessao.email)
    .eq("id", id);

  if (error) {
    console.error("[orcamentos] status", error.message);
    return { ok: false as const, mensagem: "Não conseguimos mudar o status agora." };
  }
  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${id}`);
  return { ok: true as const };
}
