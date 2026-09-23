import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import type { PerfilNegocio } from "@/lib/perfil-negocio";
import {
  brlPdf,
  dataBR,
  documentoLegivelPdf,
  estilos,
  telefoneLegivelPdf,
} from "./base";

export type ItemOrcamento = { descricao: string; quantidade: number };

export type DadosOrcamento = {
  numero: number;
  criado_em: string;
  cliente_nome: string;
  cliente_telefone: string | null;
  data_festa: string | null;
  local_festa: string | null;
  projeto_titulo: string | null;
  itens: ItemOrcamento[];
  valor_total: number;
  valor_sinal: number;
  validade: string;
  condicoes: string | null;
};

/** Cabeçalho com a marca dela. Sem logo, o nome do negócio ocupa o lugar. */
function Cabecalho({ perfil, logo }: { perfil: PerfilNegocio; logo?: string }) {
  const contato = [
    perfil.nome_responsavel,
    telefoneLegivelPdf(perfil.telefone),
    perfil.cidade,
    documentoLegivelPdf(perfil.documento),
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <View style={estilos.cabecalho}>
      {logo && <Image src={logo} style={estilos.logo} />}
      <View style={{ flex: 1 }}>
        <Text style={estilos.nomeNegocio}>{perfil.nome_negocio || "Meu negócio"}</Text>
        {contato && <Text style={estilos.contato}>{contato}</Text>}
      </View>
    </View>
  );
}

export function PdfOrcamento({
  perfil,
  orcamento,
  logo,
  percentualSinal,
}: {
  perfil: PerfilNegocio;
  orcamento: DadosOrcamento;
  logo?: string;
  percentualSinal: number;
}) {
  const saldo = orcamento.valor_total - orcamento.valor_sinal;
  const cliente = [
    orcamento.cliente_telefone && telefoneLegivelPdf(orcamento.cliente_telefone),
    orcamento.data_festa && `Festa em ${dataBR(orcamento.data_festa)}`,
    orcamento.local_festa,
  ].filter(Boolean);

  return (
    <Document
      title={`Orçamento ${orcamento.numero} — ${orcamento.cliente_nome}`}
      author={perfil.nome_negocio ?? ""}
    >
      <Page size="A4" style={estilos.pagina}>
        <Cabecalho perfil={perfil} logo={logo} />

        <View style={[estilos.secao, { flexDirection: "row", justifyContent: "space-between" }]}>
          <Text style={estilos.titulo}>Orçamento nº {orcamento.numero}</Text>
          <Text style={estilos.subtitulo}>Emitido em {dataBR(orcamento.criado_em)}</Text>
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.rotuloSecao}>Cliente</Text>
          <View style={estilos.caixa}>
            <Text style={estilos.negrito}>{orcamento.cliente_nome}</Text>
            {cliente.length > 0 && <Text style={{ marginTop: 2 }}>{cliente.join("  ·  ")}</Text>}
          </View>
        </View>

        {orcamento.projeto_titulo && (
          <View style={estilos.secao}>
            <Text style={estilos.rotuloSecao}>Projeto</Text>
            <Text style={estilos.negrito}>{orcamento.projeto_titulo}</Text>
          </View>
        )}

        <View style={estilos.secao}>
          <Text style={estilos.rotuloSecao}>O que está incluso</Text>
          <View style={{ borderWidth: 1, borderColor: "#E9DCE1", borderRadius: 6 }}>
            <View style={estilos.tabelaCabecalho}>
              <Text style={[estilos.colDescricao, estilos.negrito]}>Descrição</Text>
              <Text style={[estilos.colQuantidade, estilos.negrito]}>Qtd.</Text>
            </View>
            {orcamento.itens.length === 0 ? (
              <View style={estilos.tabelaLinha}>
                <Text style={estilos.colDescricao}>Decoração conforme combinado</Text>
                <Text style={estilos.colQuantidade}>1</Text>
              </View>
            ) : (
              orcamento.itens.map((item, i) => (
                <View key={i} style={estilos.tabelaLinha}>
                  <Text style={estilos.colDescricao}>{item.descricao}</Text>
                  <Text style={estilos.colQuantidade}>{item.quantidade}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={estilos.totalCaixa}>
          <Text style={estilos.negrito}>Valor total</Text>
          <Text style={estilos.totalValor}>{brlPdf(orcamento.valor_total)}</Text>
        </View>

        <View style={estilos.pagamento}>
          <View style={estilos.pagamentoItem}>
            <Text style={estilos.subtitulo}>Sinal de {percentualSinal}% para reservar a data</Text>
            <Text style={[estilos.negrito, { fontSize: 13, marginTop: 2 }]}>
              {brlPdf(orcamento.valor_sinal)}
            </Text>
          </View>
          <View style={estilos.pagamentoItem}>
            <Text style={estilos.subtitulo}>Saldo na entrega</Text>
            <Text style={[estilos.negrito, { fontSize: 13, marginTop: 2 }]}>{brlPdf(saldo)}</Text>
          </View>
        </View>

        <Text style={estilos.validade}>Este orçamento é válido até {dataBR(orcamento.validade)}</Text>

        {orcamento.condicoes && (
          <View style={estilos.condicoes}>
            <Text style={[estilos.rotuloSecao, { marginBottom: 3 }]}>Condições</Text>
            <Text>{orcamento.condicoes}</Text>
          </View>
        )}

        <Text style={estilos.rodape} fixed>
          {perfil.nome_negocio ?? ""}
        </Text>
      </Page>
    </Document>
  );
}

export { Cabecalho };
