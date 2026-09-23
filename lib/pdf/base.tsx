import { StyleSheet } from "@react-pdf/renderer";

/**
 * Estilos compartilhados dos PDFs (orçamento e documentos).
 *
 * Usa as fontes nativas do PDF (Helvetica) de propósito: registrar TTF do
 * Google Fonts em função serverless custa download a cada cold start. A
 * identidade vem das cores, não da tipografia.
 *
 * Nenhum PDF leva marca do Kit da Decoradora: é material comercial dela.
 */

export const COR = {
  ameixa: "#2B1B2E",
  framboesa: "#B0306B",
  confete: "#F2A93B",
  menta: "#1F7A5A",
  papel: "#FCF7F8",
  linha: "#E9DCE1",
  cinza: "#6B5B6E",
};

export const estilos = StyleSheet.create({
  pagina: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COR.ameixa,
    backgroundColor: "#FFFFFF",
    lineHeight: 1.5,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 2,
    borderBottomColor: COR.framboesa,
    paddingBottom: 12,
    marginBottom: 18,
  },
  logo: { width: 78, height: 78, objectFit: "contain" },
  nomeNegocio: { fontSize: 20, fontFamily: "Helvetica-Bold", color: COR.framboesa },
  contato: { fontSize: 9, color: COR.cinza, marginTop: 3 },
  titulo: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  subtitulo: { fontSize: 9, color: COR.cinza },
  secao: { marginBottom: 16 },
  rotuloSecao: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COR.cinza,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  caixa: {
    borderWidth: 1,
    borderColor: COR.linha,
    borderRadius: 6,
    padding: 10,
    backgroundColor: COR.papel,
  },
  linhaDupla: { flexDirection: "row", gap: 24 },
  metade: { flex: 1 },
  tabelaCabecalho: {
    flexDirection: "row",
    backgroundColor: COR.papel,
    borderBottomWidth: 1,
    borderBottomColor: COR.linha,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tabelaLinha: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COR.linha,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colDescricao: { flex: 1 },
  colQuantidade: { width: 70, textAlign: "right" },
  negrito: { fontFamily: "Helvetica-Bold" },
  totalCaixa: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COR.framboesa,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalValor: { fontSize: 24, fontFamily: "Helvetica-Bold", color: COR.framboesa },
  pagamento: { flexDirection: "row", gap: 10, marginTop: 10 },
  pagamentoItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: COR.linha,
    borderRadius: 6,
    padding: 10,
  },
  validade: {
    marginTop: 12,
    backgroundColor: "#FDF0DA",
    borderRadius: 6,
    padding: 9,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  condicoes: { marginTop: 12, fontSize: 9, color: COR.cinza },
  corpoDocumento: { fontSize: 10, textAlign: "justify" },
  assinaturas: { flexDirection: "row", gap: 30, marginTop: 40 },
  assinatura: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COR.ameixa,
    paddingTop: 6,
    fontSize: 9,
    textAlign: "center",
  },
  rodape: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COR.cinza,
    textAlign: "center",
  },
});

export function dataBR(iso: string | null | undefined) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : "";
}

export function brlPdf(valor: number) {
  return `R$ ${(Number.isFinite(valor) ? valor : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function documentoLegivelPdf(doc: string | null) {
  if (!doc) return "";
  const d = doc.replace(/\D/g, "");
  if (d.length === 11) return `CPF ${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14)
    return `CNPJ ${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return doc;
}

export function telefoneLegivelPdf(tel: string | null) {
  if (!tel) return "";
  const d = tel.replace(/\D/g, "").replace(/^55/, "");
  if (d.length < 10) return tel;
  const corte = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
}
