"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import { brl, dataCurta } from "@/lib/formato";
import { listarCalculos, type CalculoSalvo } from "@/lib/historico-local";

export function ListaHistorico() {
  // localStorage só existe no navegador: a lista entra depois da primeira pintura.
  const [calculos, setCalculos] = useState<CalculoSalvo[] | null>(null);
  useEffect(() => setCalculos(listarCalculos()), []);

  if (calculos === null) {
    return <div className="h-40 animate-pulse rounded-2xl border border-linha bg-white" aria-hidden="true" />;
  }

  if (calculos.length === 0) {
    return (
      <section className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
        <History className="mb-4 size-10 text-framboesa" aria-hidden="true" />
        <p className="max-w-xs text-lg">
          Nenhum cálculo salvo ainda. Faça seu primeiro orçamento e ele aparece aqui.
        </p>
        <Link
          href="/calculadora"
          className="mt-6 flex h-14 items-center justify-center rounded-xl bg-framboesa px-8 text-base font-semibold text-white active:bg-framboesa-escura"
        >
          Abrir calculadora
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1 className="mb-4 font-titulo text-2xl">Histórico</h1>
      <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha bg-white">
        {calculos.map((c) => (
          <li key={c.id}>
            <Link href={`/historico/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-papel">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.nome}</p>
                <p className="text-sm text-ameixa/60">{dataCurta(c.criado_em)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-titulo text-lg leading-tight tabular-nums">{brl(c.preco_final)}</p>
                <p
                  className={`text-sm font-semibold tabular-nums ${
                    c.lucro > 0 ? "text-menta" : "text-ameixa/60"
                  }`}
                >
                  Lucro {brl(c.lucro)}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-ameixa/40" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 px-1 text-sm text-ameixa/60">
        Seus cálculos ficam salvos neste aparelho.
      </p>
    </section>
  );
}
