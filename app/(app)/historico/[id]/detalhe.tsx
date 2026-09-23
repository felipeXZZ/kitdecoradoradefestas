"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Copy, Trash2 } from "lucide-react";
import { TelaResultado } from "@/components/calculadora/tela-resultado";
import { calcular } from "@/lib/calculo";
import { dataCurta } from "@/lib/formato";
import { excluirCalculo, obterCalculo, type CalculoSalvo } from "@/lib/historico-local";

export function CalculoSalvoDetalhe({ id }: { id: string }) {
  const [calculo, setCalculo] = useState<CalculoSalvo | null | undefined>(undefined);
  useEffect(() => setCalculo(obterCalculo(id)), [id]);

  const voltar = (
    <Link
      href="/historico"
      className="-ml-2 mb-2 inline-flex h-11 items-center gap-1 pr-3 text-sm font-semibold text-ameixa/70"
    >
      <ChevronLeft className="size-5" aria-hidden="true" />
      Histórico
    </Link>
  );

  if (calculo === undefined) {
    return <div className="h-64 animate-pulse rounded-2xl border border-linha bg-white" aria-hidden="true" />;
  }

  if (calculo === null) {
    return (
      <div>
        {voltar}
        <p className="rounded-xl border border-linha bg-white px-4 py-5">
          Não achamos esse cálculo neste aparelho. O histórico fica salvo no celular em que você
          calculou.
        </p>
      </div>
    );
  }

  const resultado = calcular(calculo.dados);

  return (
    <div>
      {voltar}
      {resultado.ok ? (
        <TelaResultado
          resultado={resultado.resultado}
          titulo={calculo.nome}
          subtitulo={dataCurta(calculo.criado_em)}
        >
          <Acoes id={calculo.id} />
        </TelaResultado>
      ) : (
        <section>
          <h1 className="text-lg font-semibold">{calculo.nome}</h1>
          <p className="mt-4 rounded-xl bg-confete-claro px-4 py-3">{resultado.erro}</p>
          <div className="mt-6 grid gap-2">
            <Acoes id={calculo.id} />
          </div>
        </section>
      )}
    </div>
  );
}

function Acoes({ id }: { id: string }) {
  return (
    <>
      <Link
        href={`/calculadora?duplicar=${id}`}
        className="flex h-14 items-center justify-center gap-2 rounded-xl bg-framboesa text-base font-semibold text-white active:bg-framboesa-escura"
      >
        <Copy className="size-5" aria-hidden="true" />
        Duplicar
      </Link>
      <BotaoExcluir id={id} />
    </>
  );
}

function BotaoExcluir({ id }: { id: string }) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => modalRef.current?.showModal()}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-linha bg-white font-semibold text-ameixa/80"
      >
        <Trash2 className="size-5" aria-hidden="true" />
        Excluir
      </button>

      <dialog
        ref={modalRef}
        aria-labelledby="titulo-excluir"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-papel p-0 text-ameixa backdrop:bg-ameixa/60 sm:m-auto sm:max-w-md sm:rounded-3xl"
      >
        <div className="pb-seguro p-5">
          <h2 id="titulo-excluir" className="font-titulo text-2xl leading-tight">
            Excluir este cálculo?
          </h2>
          <p className="mt-2 text-ameixa/70">Ele sai do seu histórico e não dá para recuperar.</p>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => {
                excluirCalculo(id);
                modalRef.current?.close();
                router.replace("/historico");
              }}
              className="h-14 rounded-xl bg-ameixa text-base font-semibold text-white"
            >
              Sim, excluir
            </button>
            <button
              type="button"
              onClick={() => modalRef.current?.close()}
              className="h-12 rounded-xl border border-linha bg-white font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
