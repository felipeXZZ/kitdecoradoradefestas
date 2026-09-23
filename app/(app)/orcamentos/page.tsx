import Link from "next/link";
import { ChevronRight, Plus, Receipt } from "lucide-react";
import { FerramentaBloqueada } from "@/components/ferramenta-bloqueada";
import { brl, dataCurta } from "@/lib/formato";
import { listarOrcamentos, ROTULO_STATUS, type StatusOrcamento } from "@/lib/orcamentos";
import { sessaoComPlano } from "@/lib/plano";

export const metadata = { title: "Orçamentos — Kit da Decoradora" };

const COR_STATUS: Record<StatusOrcamento, string> = {
  enviado: "bg-confete-claro text-ameixa",
  aceito: "bg-menta/10 text-menta",
  recusado: "bg-linha text-ameixa/60",
};

export default async function OrcamentosPage() {
  const { sessao, liberado } = await sessaoComPlano();

  if (!liberado) {
    return (
      <FerramentaBloqueada
        titulo="Orçamentos em PDF"
        texto="Orçamento com a sua logo, sinal calculado e validade, pronto para mandar no WhatsApp."
      />
    );
  }

  const orcamentos = await listarOrcamentos(sessao.email);

  if (orcamentos.length === 0) {
    return (
      <section className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <Receipt className="mb-4 size-10 text-framboesa" aria-hidden="true" />
        <p className="max-w-xs text-lg">Nenhum orçamento ainda. Faça o primeiro em dois minutos.</p>
        <Link
          href="/orcamentos/novo"
          className="mt-6 flex h-14 items-center justify-center rounded-xl bg-framboesa px-8 text-base font-semibold text-white active:bg-framboesa-escura"
        >
          Novo orçamento
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-titulo text-2xl">Orçamentos</h1>
        <Link
          href="/orcamentos/novo"
          className="flex h-11 items-center gap-1.5 rounded-xl bg-framboesa px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-5" aria-hidden="true" />
          Novo
        </Link>
      </div>

      <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha bg-white">
        {orcamentos.map((o) => (
          <li key={o.id}>
            <Link href={`/orcamentos/${o.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-papel">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  nº {o.numero} · {o.cliente_nome}
                </p>
                <p className="text-sm text-ameixa/60">
                  {o.data_festa ? `Festa em ${dataCurta(o.data_festa)}` : dataCurta(o.criado_em)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-titulo text-lg leading-tight tabular-nums">{brl(o.valor_total)}</p>
                <span
                  className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${COR_STATUS[o.status]}`}
                >
                  {ROTULO_STATUS[o.status]}
                </span>
              </div>
              <ChevronRight className="size-5 shrink-0 text-ameixa/40" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
