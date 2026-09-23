import { Lock } from "lucide-react";
import { CHECKOUT_UPGRADE_URL } from "@/lib/config";

/**
 * Prévia borrada + cadeado, no mesmo padrão dos módulos bloqueados do acervo.
 * Ela precisa ver a ferramenta existindo para querer liberar.
 */
export function FerramentaBloqueada({
  titulo,
  texto,
  children,
}: {
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto max-w-xl">
      {children && (
        <div className="pointer-events-none select-none blur-[6px] saturate-50" aria-hidden="true">
          {children}
        </div>
      )}

      <section
        className={
          children
            ? "absolute inset-x-0 top-8 mx-auto max-w-sm rounded-2xl border border-confete/60 bg-papel/95 p-5 text-center shadow-lg"
            : "rounded-2xl border border-confete/60 bg-confete-claro p-5 text-center"
        }
      >
        <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-confete text-ameixa">
          <Lock className="size-6" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <h1 className="font-titulo text-2xl leading-tight">{titulo}</h1>
        <p className="mt-2 text-ameixa/80">{texto}</p>
        <p className="mt-3 text-sm font-semibold text-framboesa">Disponível no Kit Completo</p>
        <a
          href={CHECKOUT_UPGRADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex h-14 items-center justify-center rounded-xl bg-framboesa text-base font-semibold text-white active:bg-framboesa-escura"
        >
          Liberar tudo por R$ 12
        </a>
      </section>
    </div>
  );
}
