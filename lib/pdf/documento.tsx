import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { PerfilNegocio } from "@/lib/perfil-negocio";
import { estilos } from "./base";
import { Cabecalho } from "./orcamento";

/**
 * PDF de um modelo de `documentos_modelo`: contrato, termo, recibo, checklist.
 * O corpo vem do banco com as variáveis já substituídas.
 */
export function PdfDocumento({
  perfil,
  titulo,
  corpo,
  logo,
  cidade,
  comAssinaturas,
  nomeCliente,
}: {
  perfil: PerfilNegocio;
  titulo: string;
  corpo: string;
  logo?: string;
  cidade?: string | null;
  comAssinaturas: boolean;
  nomeCliente?: string | null;
}) {
  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <Document title={titulo} author={perfil.nome_negocio ?? ""}>
      <Page size="A4" style={estilos.pagina}>
        <Cabecalho perfil={perfil} logo={logo} />

        <View style={estilos.secao}>
          <Text style={estilos.titulo}>{titulo}</Text>
        </View>

        {/* Parágrafo por linha em branco, para o texto do banco respirar. */}
        {corpo.split(/\n{2,}/).map((paragrafo, i) => (
          <Text key={i} style={[estilos.corpoDocumento, { marginBottom: 8 }]}>
            {paragrafo.trim()}
          </Text>
        ))}

        {comAssinaturas && (
          <>
            <Text style={{ marginTop: 24 }}>
              {[cidade, hoje].filter(Boolean).join(", ")}
            </Text>
            <View style={estilos.assinaturas}>
              <Text style={estilos.assinatura}>
                {perfil.nome_responsavel || perfil.nome_negocio || "Prestadora"}
              </Text>
              <Text style={estilos.assinatura}>{nomeCliente || "Contratante"}</Text>
            </View>
          </>
        )}

        <Text style={estilos.rodape} fixed>
          Modelo de referência. Recomendamos a revisão por um profissional de sua confiança.
        </Text>
      </Page>
    </Document>
  );
}

/** Troca {{variaveis}} pelos dados do perfil, do orçamento e do cliente. */
export function preencherCorpo(corpo: string, valores: Record<string, string>) {
  return corpo.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, chave: string) => valores[chave] ?? "____");
}
