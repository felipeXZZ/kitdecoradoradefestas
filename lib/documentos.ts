import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Os quatro documentos são fixos; o texto de cada um vem de `documentos_modelo`.
 * Tipo sem linha no banco aparece como "Em breve" na tela — é o caso do
 * contrato e do termo, que só entram depois da revisão de um advogado.
 */
export const TIPOS_DOCUMENTO = [
  {
    tipo: "contrato",
    titulo: "Contrato de prestação de serviço",
    descricao: "O combinado por escrito, com data, valor e o que está incluso",
    assinaturas: true,
  },
  {
    tipo: "termo",
    titulo: "Termo de responsabilidade por danos",
    descricao: "Protege o seu material emprestado na festa",
    assinaturas: true,
  },
  {
    tipo: "recibo",
    titulo: "Recibo de sinal",
    descricao: "Comprovante do sinal que reservou a data",
    assinaturas: true,
  },
  {
    tipo: "checklist",
    titulo: "Checklist de montagem e retirada",
    descricao: "Para não esquecer nada na correria do dia",
    assinaturas: false,
  },
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number]["tipo"];

export type ModeloDocumento = {
  tipo: string;
  titulo: string;
  descricao: string | null;
  corpo: string;
};

export async function listarModelos() {
  const { data, error } = await createAdminClient()
    .from("documentos_modelo")
    .select("tipo, titulo, descricao, corpo")
    .eq("ativo", true);

  if (error) {
    console.error("[documentos] listar", error.message);
    return new Map<string, ModeloDocumento>();
  }
  return new Map((data ?? []).map((m) => [m.tipo as string, m as ModeloDocumento]));
}

export async function obterModelo(tipo: string) {
  const { data } = await createAdminClient()
    .from("documentos_modelo")
    .select("tipo, titulo, descricao, corpo")
    .eq("tipo", tipo)
    .eq("ativo", true)
    .maybeSingle();
  return (data as ModeloDocumento | null) ?? null;
}

export function precisaAssinatura(tipo: string) {
  return TIPOS_DOCUMENTO.find((t) => t.tipo === tipo)?.assinaturas ?? false;
}
