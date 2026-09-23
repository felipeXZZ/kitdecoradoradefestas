import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { brl, dataCurta } from "@/lib/formato";
import { linkAssinado, obterOrcamento, ROTULO_STATUS } from "@/lib/orcamentos";
import { sessaoComPlano } from "@/lib/plano";
import { AcoesOrcamento } from "./acoes";

export const metadata = { title: "Orçamento — Kit da Decoradora" };

export default async function OrcamentoPage({ params }: PageProps<"/orcamentos/[id]">) {
  const { sessao, liberado } = await sessaoComPlano();
  if (!liberado) notFound();

  const { id } = await params;
  const orcamento = await obterOrcamento(sessao.email, id);
  if (!orcamento) notFound();

  const link = await linkAssinado(orcamento.pdf_path);
  const saldo = orcamento.valor_total - orcamento.valor_sinal;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/orcamentos"
        className="-ml-2 mb-2 inline-flex h-11 items-center gap-1 pr-3 text-sm font-semibold text-ameixa/70"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        Orçamentos
      </Link>

      <header className="mb-4">
        <p className="text-sm text-ameixa/60">
          Orçamento nº {orcamento.numero} · {ROTULO_STATUS[orcamento.status]}
        </p>
        <h1 className="font-titulo text-2xl leading-tight">{orcamento.cliente_nome}</h1>
        <p className="mt-1 text-ameixa/70">
          {[
            orcamento.data_festa && `Festa em ${dataCurta(orcamento.data_festa)}`,
            orcamento.local_festa,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <p className="text-sm font-semibold text-ameixa/60">Valor total</p>
      <p className="font-titulo text-[clamp(2.5rem,13vw,4.5rem)] leading-none tracking-tight text-framboesa tabular-nums">
        {brl(orcamento.valor_total)}
      </p>

      <dl className="mt-5 divide-y divide-linha border-y border-linha">
        <Linha rotulo="Sinal para reservar" valor={brl(orcamento.valor_sinal)} />
        <Linha rotulo="Saldo na entrega" valor={brl(saldo)} />
        <Linha rotulo="Válido até" valor={dataCurta(orcamento.validade)} />
      </dl>

      {orcamento.itens.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-ameixa/60">O que está incluso</h2>
          <ul className="divide-y divide-linha rounded-2xl border border-linha bg-white px-4">
            {orcamento.itens.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 flex-1 truncate">{item.descricao}</span>
                <span className="shrink-0 text-ameixa/60">{item.quantidade}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6">
        <AcoesOrcamento
          id={orcamento.id}
          numero={orcamento.numero}
          clienteNome={orcamento.cliente_nome}
          clienteTelefone={orcamento.cliente_telefone}
          validade={orcamento.validade}
          status={orcamento.status}
          link={link}
        />
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-ameixa/70">{rotulo}</dt>
      <dd className="font-semibold tabular-nums">{valor}</dd>
    </div>
  );
}
