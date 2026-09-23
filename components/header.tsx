import Link from "next/link";
import { LogOut } from "lucide-react";
import { IconeWhatsapp } from "@/components/icone-whatsapp";
import { linkWhatsapp } from "@/lib/config";

export function Header() {
  return (
    <header className="pt-seguro fixed inset-x-0 top-0 z-30 bg-ameixa text-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex h-11 items-center font-titulo text-lg">
          Kit da Decoradora
        </Link>

        <div className="flex items-center gap-1">
          <a
            href={linkWhatsapp()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar com o suporte no WhatsApp"
            className="grid size-11 place-items-center rounded-full active:bg-white/10"
          >
            <IconeWhatsapp className="size-6" />
          </a>

          <form action="/sair" method="post">
            <button
              type="submit"
              className="flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold active:bg-white/10"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
