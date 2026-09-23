"use client";

import type { Ref } from "react";
import { Lock, X } from "lucide-react";
import { CHECKOUT_UPGRADE_URL } from "@/lib/config";
import type { Modulo } from "@/lib/tipos";

type Props = { ref: Ref<HTMLDialogElement>; bloqueados: Modulo[] };

export function ModalUpgrade({ ref, bloqueados }: Props) {
  return (
    <dialog
      ref={ref}
      aria-labelledby="titulo-upgrade"
      // Toque fora do conteúdo fecha o modal.
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl bg-papel p-0 text-ameixa backdrop:bg-ameixa/60 sm:m-auto sm:max-w-md sm:rounded-3xl"
    >
      <div className="pb-seguro flex max-h-[85dvh] flex-col">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <h2 id="titulo-upgrade" className="font-titulo text-2xl leading-tight">
            Libere todo o acervo
          </h2>
          <form method="dialog">
            <button
              type="submit"
              aria-label="Fechar"
              className="-mt-1 -mr-2 grid size-11 place-items-center rounded-full text-ameixa/60 active:bg-linha"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </form>
        </div>

        <p className="px-5 pt-1 text-ameixa/70">
          Com o Kit Completo você acessa estes módulos para sempre, sem mensalidade:
        </p>

        <ul className="mt-4 flex-1 divide-y divide-linha overflow-y-auto border-y border-linha bg-white px-5">
          {bloqueados.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <Lock className="size-4 shrink-0 text-confete" strokeWidth={2.5} aria-hidden="true" />
              <span className="flex-1 truncate font-semibold">{m.titulo}</span>
              {m.contador && <span className="shrink-0 text-sm text-ameixa/60">{m.contador}</span>}
            </li>
          ))}
        </ul>

        <div className="p-5">
          <a
            href={CHECKOUT_UPGRADE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-full items-center justify-center rounded-xl bg-framboesa text-base font-semibold text-white active:bg-framboesa-escura"
          >
            Liberar tudo por R$ 12
          </a>
        </div>
      </div>
    </dialog>
  );
}
