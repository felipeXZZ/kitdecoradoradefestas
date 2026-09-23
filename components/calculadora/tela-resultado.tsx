import { AlertTriangle, ChevronDown } from "lucide-react";
import type { Resultado } from "@/lib/calculo";
import { brl, numero } from "@/lib/formato";

type Props = {
  resultado: Resultado;
  /** Nome da festa (histórico) ou nada (cálculo novo). */
  titulo?: string;
  subtitulo?: string;
  children?: React.ReactNode;
};

/**
 * O único lugar ousado do app: é a tela que a cliente printa e manda no
 * WhatsApp. Usada pela calculadora e pelo histórico (modo leitura).
 */
export function TelaResultado({ resultado: r, titulo, subtitulo, children }: Props) {
  const semLucro = r.lucro <= 0;

  const linhas: [string, number][] = [
    ["Materiais de consumo", r.materiais],
    ["Material reutilizável (rateado)", r.reutilizavel],
    [`Seu tempo (${numero(r.horasTotais)} h)`, r.maoDeObra],
    ["Ajudante", r.ajudante],
    ["Deslocamento", r.deslocamento],
    ["Custo fixo desta festa", r.rateioFixo],
  ];

  return (
    <section className="flex min-h-[calc(100dvh-10rem)] flex-col">
      {titulo && (
        <header className="mb-4">
          <h1 className="text-lg font-semibold leading-snug">{titulo}</h1>
          {subtitulo && <p className="text-sm text-ameixa/60">{subtitulo}</p>}
        </header>
      )}

      {semLucro && (
        <p className="mb-4 flex items-start gap-2.5 rounded-xl bg-confete px-4 py-3 font-semibold text-ameixa">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          Nesse preço você não tem lucro. Aumente a margem ou revise os custos.
        </p>
      )}

      <p className="text-sm font-semibold text-ameixa/60">Preço final</p>
      <p
        className={`font-titulo leading-[0.95] tracking-tight break-words tabular-nums ${
          semLucro ? "text-ameixa" : "text-framboesa"
        } ${
          // Cabe numa linha em 390px até "R$ 99.999,99"; acima disso encolhe.
          brl(r.precoFinal).length <= 12
            ? "text-[clamp(2.5rem,14vw,6rem)]"
            : "text-[clamp(2.25rem,11vw,5.5rem)]"
        }`}
      >
        {brl(r.precoFinal)}
      </p>

      <p className={`mt-3 text-lg font-semibold ${semLucro ? "text-ameixa/70" : "text-menta"}`}>
        Lucro de {brl(r.lucro)} — margem de {numero(r.margemReal)}%
      </p>

      <dl className="mt-6 divide-y divide-linha border-y border-linha">
        <LinhaValor rotulo="Custo total" valor={r.custoDireto} />
        <LinhaValor rotulo="Sinal sugerido (50%)" valor={r.sinal} />
        <LinhaValor rotulo="Saldo na entrega" valor={r.saldo} />
      </dl>

      <details className="group mt-4 rounded-xl border border-linha bg-white">
        <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 font-semibold [&::-webkit-details-marker]:hidden">
          Ver a conta completa
          <ChevronDown className="size-5 transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        <dl className="divide-y divide-linha border-t border-linha px-4 text-sm">
          {linhas.map(([rotulo, valor]) => (
            <LinhaValor key={rotulo} rotulo={rotulo} valor={valor} />
          ))}
          <LinhaValor rotulo="Custo total" valor={r.custoDireto} forte />
          <LinhaValor rotulo="Taxas e impostos" valor={r.valorTaxas} />
          <LinhaValor rotulo="Lucro" valor={r.lucro} forte />
        </dl>
      </details>

      {children && <div className="mt-auto grid gap-2 pt-6">{children}</div>}
    </section>
  );
}

function LinhaValor({ rotulo, valor, forte }: { rotulo: string; valor: number; forte?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${forte ? "font-semibold" : ""}`}>
      <dt className={forte ? "" : "text-ameixa/70"}>{rotulo}</dt>
      <dd className="tabular-nums">{brl(valor)}</dd>
    </div>
  );
}
