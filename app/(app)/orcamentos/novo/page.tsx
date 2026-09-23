import Link from "next/link";
import { redirect } from "next/navigation";
import { FerramentaBloqueada } from "@/components/ferramenta-bloqueada";
import { obterOrcamento } from "@/lib/orcamentos";
import { getPerfilNegocio, perfilCompleto } from "@/lib/perfil-negocio";
import { sessaoComPlano } from "@/lib/plano";
import { FormOrcamento } from "./form-orcamento";
import type { DadosNovoOrcamento } from "../actions";

export const metadata = { title: "Novo orçamento — Kit da Decoradora" };

export default async function NovoOrcamentoPage({ searchParams }: PageProps<"/orcamentos/novo">) {
  const { sessao, liberado } = await sessaoComPlano();
  if (!liberado) {
    return (
      <FerramentaBloqueada
        titulo="Orçamento em PDF"
        texto="Monte um orçamento com a sua logo e envie no WhatsApp em dois minutos."
      />
    );
  }

  const perfil = await getPerfilNegocio(sessao.email);
  // Sem os dados do negócio o PDF sai sem cabeçalho: preenche antes.
  if (!perfilCompleto(perfil)) redirect("/meus-dados");

  const { duplicar } = await searchParams;
  let inicial: DadosNovoOrcamento | null = null;

  if (typeof duplicar === "string") {
    const anterior = await obterOrcamento(sessao.email, duplicar);
    if (anterior) {
      const percentual = Math.round((anterior.valor_sinal / (anterior.valor_total || 1)) * 100);
      inicial = {
        cliente_nome: "",
        cliente_telefone: "",
        data_festa: "",
        local_festa: anterior.local_festa ?? "",
        projeto_id: "",
        projeto_titulo: anterior.projeto_titulo ?? "",
        itens: anterior.itens,
        valor_total: anterior.valor_total,
        percentual_sinal: Number.isFinite(percentual) ? percentual : perfil.percentual_sinal,
        validade_dias: perfil.validade_padrao_dias,
        condicoes: anterior.condicoes ?? perfil.condicoes_padrao ?? "",
      };
    }
  }

  return (
    <div>
      <Link
        href="/orcamentos"
        className="-ml-2 mb-2 inline-flex h-11 items-center pr-3 text-sm font-semibold text-ameixa/70"
      >
        Orçamentos
      </Link>
      <FormOrcamento perfil={perfil} duplicar={inicial} />
    </div>
  );
}
