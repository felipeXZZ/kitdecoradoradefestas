"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  FileText,
  History,
  LayoutGrid,
  MessageSquareQuote,
  Receipt,
  Store,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

const ABAS = [
  { href: "/", rotulo: "Acervo", Icone: LayoutGrid },
  { href: "/calculadora", rotulo: "Calculadora", Icone: Calculator },
  { href: "/historico", rotulo: "Histórico", Icone: History },
] as const;

// Cinco abas é o limite. O que vier depois entra dentro de "Ferramentas".
const FERRAMENTAS = [
  {
    href: "/meus-dados",
    rotulo: "Meus dados",
    texto: "Seu nome, logo e condições nos documentos",
    Icone: Store,
    pronta: true,
  },
  {
    href: "/orcamentos",
    rotulo: "Orçamentos",
    texto: "Orçamento em PDF com a sua marca",
    Icone: Receipt,
    pronta: false,
  },
  {
    href: "/documentos",
    rotulo: "Documentos",
    texto: "Contrato, termo, recibo e checklist",
    Icone: FileText,
    pronta: false,
  },
  {
    href: "/scripts",
    rotulo: "Scripts",
    texto: "O que responder no WhatsApp",
    Icone: MessageSquareQuote,
    pronta: false,
  },
] as const;

const ROTAS_FERRAMENTAS = FERRAMENTAS.map((f) => f.href);

export function BarraNavegacao() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDialogElement>(null);
  const naFerramenta = ROTAS_FERRAMENTAS.some((r) => pathname.startsWith(r));

  const classe = (ativa: boolean) =>
    `flex h-full w-full flex-col items-center justify-center gap-1 text-xs ${
      ativa ? "font-semibold text-framboesa" : "text-ameixa/60"
    }`;

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="pb-seguro fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
          {ABAS.map(({ href, rotulo, Icone }) => {
            const ativa = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link href={href} aria-current={ativa ? "page" : undefined} className={classe(ativa)}>
                  <Icone className="size-6" strokeWidth={ativa ? 2.25 : 1.75} aria-hidden="true" />
                  {rotulo}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              type="button"
              onClick={() => menuRef.current?.showModal()}
              aria-haspopup="dialog"
              className={classe(naFerramenta)}
            >
              <Wrench className="size-6" strokeWidth={naFerramenta ? 2.25 : 1.75} aria-hidden="true" />
              Ferramentas
            </button>
          </li>

          <li>
            <Link
              href="/conta"
              aria-current={pathname.startsWith("/conta") ? "page" : undefined}
              className={classe(pathname.startsWith("/conta"))}
            >
              <UserRound
                className="size-6"
                strokeWidth={pathname.startsWith("/conta") ? 2.25 : 1.75}
                aria-hidden="true"
              />
              Conta
            </Link>
          </li>
        </ul>
      </nav>

      <MenuFerramentas ref={menuRef} />
    </>
  );
}

function MenuFerramentas({ ref }: { ref: React.Ref<HTMLDialogElement> }) {
  return (
    <dialog
      ref={ref}
      aria-labelledby="titulo-ferramentas"
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-papel p-0 text-ameixa backdrop:bg-ameixa/60 sm:m-auto sm:max-w-md sm:rounded-3xl"
    >
      <div className="pb-seguro p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 id="titulo-ferramentas" className="font-titulo text-2xl leading-tight">
            Ferramentas
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

        <ul className="mt-4 grid gap-2">
          {FERRAMENTAS.map(({ href, rotulo, texto, Icone, pronta }) => (
            <li key={href}>
              {pronta ? (
                <Link
                  href={href}
                  onClick={(e) => e.currentTarget.closest("dialog")?.close()}
                  className="flex items-center gap-3 rounded-2xl border border-linha bg-white p-3 active:bg-papel"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-framboesa/10 text-framboesa">
                    <Icone className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{rotulo}</span>
                    <span className="block truncate text-sm text-ameixa/70">{texto}</span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-linha bg-white/60 p-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linha/60 text-ameixa/40">
                    <Icone className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ameixa/50">{rotulo}</span>
                    <span className="block truncate text-sm text-ameixa/50">{texto}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-confete-claro px-2.5 py-1 text-xs font-semibold text-ameixa">
                    Em breve
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
