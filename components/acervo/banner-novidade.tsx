import { Sparkles } from "lucide-react";
import { BANNER_NOVIDADE, BANNER_NOVIDADE_URL } from "@/lib/config";

export function BannerNovidade() {
  if (!BANNER_NOVIDADE) return null;

  return (
    <aside className="flex flex-col gap-3 rounded-2xl border border-confete/50 bg-confete-claro p-4 sm:flex-row sm:items-center">
      <p className="flex flex-1 items-start gap-2.5 font-semibold">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-confete" aria-hidden="true" />
        {BANNER_NOVIDADE}
      </p>
      {BANNER_NOVIDADE_URL && (
        <a
          href={BANNER_NOVIDADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-ameixa px-4 text-sm font-semibold text-white"
        >
          Ver novidades
        </a>
      )}
    </aside>
  );
}
