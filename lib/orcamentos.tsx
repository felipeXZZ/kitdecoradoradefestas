import { renderToBuffer } from "@react-pdf/renderer";
import { getPerfilNegocio, pastaDoEmail, type PerfilNegocio } from "@/lib/perfil-negocio";
import { PdfOrcamento, type DadosOrcamento, type ItemOrcamento } from "@/lib/pdf/orcamento";
import { createAdminClient } from "@/lib/supabase/admin";

export const BUCKET_DOCUMENTOS = "documentos";
const VALIDADE_LINK_SEGUNDOS = 7 * 24 * 3600;

export type StatusOrcamento = "enviado" | "aceito" | "recusado";

export type Orcamento = DadosOrcamento & {
  id: string;
  status: StatusOrcamento;
  pdf_path: string | null;
};

const CAMPOS =
  "id, numero, cliente_nome, cliente_telefone, data_festa, local_festa, projeto_id, projeto_titulo, itens, valor_total, valor_sinal, validade, condicoes, status, pdf_path, criado_em";

function normalizar(linha: Record<string, unknown>): Orcamento {
  const itens = Array.isArray(linha.itens) ? (linha.itens as ItemOrcamento[]) : [];
  return {
    id: String(linha.id),
    numero: Number(linha.numero),
    criado_em: String(linha.criado_em),
    cliente_nome: String(linha.cliente_nome ?? ""),
    cliente_telefone: (linha.cliente_telefone as string) ?? null,
    data_festa: (linha.data_festa as string) ?? null,
    local_festa: (linha.local_festa as string) ?? null,
    projeto_titulo: (linha.projeto_titulo as string) ?? null,
    itens: itens.map((i) => ({
      descricao: String(i.descricao ?? ""),
      quantidade: Number(i.quantidade) || 1,
    })),
    valor_total: Number(linha.valor_total) || 0,
    valor_sinal: Number(linha.valor_sinal) || 0,
    validade: String(linha.validade ?? ""),
    condicoes: (linha.condicoes as string) ?? null,
    status: (["enviado", "aceito", "recusado"] as const).includes(linha.status as StatusOrcamento)
      ? (linha.status as StatusOrcamento)
      : "enviado",
    pdf_path: (linha.pdf_path as string) ?? null,
  };
}

export async function listarOrcamentos(email: string) {
  const { data, error } = await createAdminClient()
    .from("orcamentos")
    .select(CAMPOS)
    .eq("email", email)
    .order("criado_em", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[orcamentos] listar", error.message);
    return [];
  }
  return (data ?? []).map(normalizar);
}

export async function obterOrcamento(email: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAdminClient()
    .from("orcamentos")
    .select(CAMPOS)
    .eq("email", email)
    .eq("id", id)
    .maybeSingle();
  return data ? normalizar(data) : null;
}

/** Número reservado no banco, com lock. Nunca calculado no cliente. */
export async function reservarNumero(email: string) {
  const { data, error } = await createAdminClient().rpc("proximo_numero_orcamento", {
    p_email: email,
  });
  if (error || typeof data !== "number") throw new Error(`número do orçamento: ${error?.message}`);
  return data;
}

/** A logo entra no PDF como data URI: o bucket é privado. */
export async function logoParaPdf(perfil: PerfilNegocio) {
  if (!perfil.logo_path) return undefined;
  const { data, error } = await createAdminClient()
    .storage.from("logos")
    .download(perfil.logo_path);
  if (error || !data) {
    console.warn("[pdf] logo", error?.message);
    return undefined;
  }
  const bytes = Buffer.from(await data.arrayBuffer());
  const tipo = perfil.logo_path.endsWith(".png")
    ? "image/png"
    : perfil.logo_path.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  return `data:${tipo};base64,${bytes.toString("base64")}`;
}

/** Gera o PDF, guarda no bucket privado e devolve o caminho. */
export async function gerarPdfOrcamento(email: string, orcamento: Orcamento) {
  const perfil = await getPerfilNegocio(email);
  const logo = await logoParaPdf(perfil);
  const percentual = Math.round((orcamento.valor_sinal / (orcamento.valor_total || 1)) * 100);

  const buffer = await renderToBuffer(
    <PdfOrcamento
      perfil={perfil}
      orcamento={orcamento}
      logo={logo}
      percentualSinal={Number.isFinite(percentual) ? percentual : perfil.percentual_sinal}
    />,
  );

  const caminho = `${pastaDoEmail(email)}/orcamento-${orcamento.numero}.pdf`;
  const { error } = await createAdminClient()
    .storage.from(BUCKET_DOCUMENTOS)
    .upload(caminho, buffer, { contentType: "application/pdf", upsert: true });

  if (error) throw new Error(`grava PDF: ${error.message}`);
  return caminho;
}

export async function linkAssinado(caminho: string | null, segundos = VALIDADE_LINK_SEGUNDOS) {
  if (!caminho) return null;
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET_DOCUMENTOS)
    .createSignedUrl(caminho, segundos);
  if (error) {
    console.warn("[orcamentos] link", error.message);
    return null;
  }
  return data.signedUrl;
}

export const ROTULO_STATUS: Record<StatusOrcamento, string> = {
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
};
