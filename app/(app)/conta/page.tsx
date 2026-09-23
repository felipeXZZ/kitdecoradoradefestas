import Link from "next/link";
import { ChevronRight, LogOut, Settings, Sparkles } from "lucide-react";
import { IconeWhatsapp } from "@/components/icone-whatsapp";
import { ehAdmin } from "@/lib/admin";
import { CHECKOUT_UPGRADE_URL, linkWhatsapp } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Conta — Kit da Decoradora" };

const NOME_PLANO = {
  basico: "Kit Básico — acesso vitalício",
  completo: "Kit Completo — acesso vitalício",
} as const;

export default async function ContaPage() {
  const sessao = await exigirSessao();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="font-titulo text-2xl">Conta</h1>

      <dl className="divide-y divide-linha rounded-2xl border border-linha bg-white px-4">
        <div className="py-3">
          <dt className="text-sm text-ameixa/60">E-mail</dt>
          <dd className="font-semibold break-all">{sessao.email}</dd>
        </div>
        <div className="py-3">
          <dt className="text-sm text-ameixa/60">Plano</dt>
          <dd className="font-semibold">{NOME_PLANO[sessao.plano]}</dd>
        </div>
      </dl>

      {sessao.plano === "basico" && (
        <section className="rounded-2xl border border-confete/60 bg-confete-claro p-4">
          <h2 className="flex items-center gap-2 font-titulo text-xl">
            <Sparkles className="size-5 text-confete" aria-hidden="true" />
            Libere o Kit Completo
          </h2>
          <p className="mt-1 text-ameixa/80">
            Todos os módulos, todas as ocasiões, para sempre. Pagamento único.
          </p>
          <a
            href={CHECKOUT_UPGRADE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-14 items-center justify-center rounded-xl bg-framboesa text-base font-semibold text-white active:bg-framboesa-escura"
          >
            Liberar tudo por R$ 12
          </a>
        </section>
      )}

      <div className="grid gap-2">
        <a
          href={linkWhatsapp()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-menta text-base font-semibold text-white"
        >
          <IconeWhatsapp className="size-5" />
          Falar com o suporte
        </a>

        <form action="/sair" method="post">
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-linha bg-white font-semibold"
          >
            <LogOut className="size-5" aria-hidden="true" />
            Sair
          </button>
        </form>
      </div>

      {ehAdmin(sessao.email) && (
        <Link
          href="/admin"
          className="flex h-12 items-center gap-3 rounded-xl border border-dashed border-linha px-4 text-sm font-semibold text-ameixa/70"
        >
          <Settings className="size-5" aria-hidden="true" />
          <span className="flex-1">Administrar módulos</span>
          <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
