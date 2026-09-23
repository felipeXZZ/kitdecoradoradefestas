"use server";

import { renderToBuffer } from "@react-pdf/renderer";
import { obterModelo, precisaAssinatura } from "@/lib/documentos";
import { logoParaPdf, obterOrcamento, BUCKET_DOCUMENTOS, linkAssinado } from "@/lib/orcamentos";
import { getPerfilNegocio, pastaDoEmail } from "@/lib/perfil-negocio";
import { brlPdf, dataBR, documentoLegivelPdf, telefoneLegivelPdf } from "@/lib/pdf/base";
import { PdfDocumento, preencherCorpo } from "@/lib/pdf/documento";
import { exigirSessao } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";

export type DadosDocumento = {
  tipo: string;
  orcamento_id: string;
  cliente_nome: string;
  data_festa: string;
  local_festa: string;
  valor_total: number;
  valor_sinal: number;
};

export type RespostaDocumento = { ok: true; link: string } | { ok: false; mensagem: string };

export async function gerarDocumento(d: DadosDocumento): Promise<RespostaDocumento> {
  const sessao = await exigirSessao();
  if (sessao.plano !== "completo") return { ok: false, mensagem: "Disponível no Kit Completo." };

  const modelo = await obterModelo(d.tipo);
  if (!modelo) return { ok: false, mensagem: "Esse documento ainda não está disponível." };

  const perfil = await getPerfilNegocio(sessao.email);
  if (!perfil.nome_negocio) {
    return { ok: false, mensagem: "Preencha os seus dados antes, em Ferramentas → Meus dados." };
  }

  // Orçamento escolhido tem prioridade sobre o que foi digitado na mão.
  let dados = { ...d };
  if (d.orcamento_id) {
    const orcamento = await obterOrcamento(sessao.email, d.orcamento_id);
    if (orcamento) {
      dados = {
        ...dados,
        cliente_nome: orcamento.cliente_nome,
        data_festa: orcamento.data_festa ?? "",
        local_festa: orcamento.local_festa ?? "",
        valor_total: orcamento.valor_total,
        valor_sinal: orcamento.valor_sinal,
      };
    }
  }

  const cliente = dados.cliente_nome.trim();
  if (!cliente) return { ok: false, mensagem: "Preencha o nome do cliente." };

  const corpo = preencherCorpo(modelo.corpo, {
    nome_negocio: perfil.nome_negocio,
    nome_responsavel: perfil.nome_responsavel ?? perfil.nome_negocio,
    telefone: telefoneLegivelPdf(perfil.telefone),
    documento_prestadora: documentoLegivelPdf(perfil.documento),
    cidade: perfil.cidade ?? "",
    cliente_nome: cliente,
    data_festa: dataBR(dados.data_festa) || "____/____/______",
    local_festa: dados.local_festa.trim() || "____________________",
    valor_total: brlPdf(dados.valor_total),
    valor_sinal: brlPdf(dados.valor_sinal),
    valor_saldo: brlPdf(Math.max(0, dados.valor_total - dados.valor_sinal)),
    data_hoje: new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
  });

  try {
    const logo = await logoParaPdf(perfil);
    const buffer = await renderToBuffer(
      <PdfDocumento
        perfil={perfil}
        titulo={modelo.titulo}
        corpo={corpo}
        logo={logo}
        cidade={perfil.cidade}
        comAssinaturas={precisaAssinatura(d.tipo)}
        nomeCliente={cliente}
      />,
    );

    const arquivo = `${d.tipo}-${cliente.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.pdf`;
    const caminho = `${pastaDoEmail(sessao.email)}/${arquivo}`;
    const { error } = await createAdminClient()
      .storage.from(BUCKET_DOCUMENTOS)
      .upload(caminho, buffer, { contentType: "application/pdf", upsert: true });
    if (error) throw new Error(error.message);

    const link = await linkAssinado(caminho);
    if (!link) throw new Error("sem link");
    return { ok: true, link };
  } catch (e) {
    console.error("[documentos] gerar", e);
    return { ok: false, mensagem: "Não conseguimos gerar o PDF agora. Tente de novo." };
  }
}
