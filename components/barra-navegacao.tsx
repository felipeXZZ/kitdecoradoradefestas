"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, History, LayoutGrid, UserRound } from "lucide-react";

const ABAS = [
  { href: "/", rotulo: "Acervo", Icone: LayoutGrid },
  { href: "/calculadora", rotulo: "Calculadora", Icone: Calculator },
  { href: "/historico", rotulo: "Histórico", Icone: History },
  { href: "/conta", rotulo: "Conta", Icone: UserRound },
] as const;

export function BarraNavegacao() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="pb-seguro fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-white"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {ABAS.map(({ href, rotulo, Icone }) => {
          const ativa = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativa ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs ${
                  ativa ? "font-semibold text-framboesa" : "text-ameixa/60"
                }`}
              >
                <Icone className="size-6" strokeWidth={ativa ? 2.25 : 1.75} aria-hidden="true" />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
