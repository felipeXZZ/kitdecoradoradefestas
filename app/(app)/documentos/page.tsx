import { redirect } from "next/navigation";
import { FerramentaBloqueada } from "@/components/ferramenta-bloqueada";
import { listarModelos } from "@/lib/documentos";
import { listarOrcamentos } from "@/lib/orcamentos";
import { getPerfilNegocio, perfilCompleto } from "@/lib/perfil-negocio";
import { sessaoComPlano } from "@/lib/plano";
import { ListaDocumentos } from "./lista-documentos";

export const metadata = { title: "Documentos — Kit da Decoradora" };

export default async function DocumentosPage() {
  const { sessao, liberado } = await sessaoComPlano();
  if (!liberado) {
    return (
      <FerramentaBloqueada
        titulo="Documentos prontos"
        texto="Contrato, termo de responsabilidade, recibo de sinal e checklist, com os seus dados já preenchidos."
      />
    );
  }

  const perfil = await getPerfilNegocio(sessao.email);
  if (!perfilCompleto(perfil)) redirect("/meus-dados");

  const [modelos, orcamentos] = await Promise.all([
    listarModelos(),
    listarOrcamentos(sessao.email),
  ]);

  return (
    <ListaDocumentos
      disponiveis={[...modelos.keys()]}
      orcamentos={orcamentos.slice(0, 30).map((o) => ({
        id: o.id,
        numero: o.numero,
        cliente_nome: o.cliente_nome,
        valor_total: o.valor_total,
      }))}
    />
  );
}
