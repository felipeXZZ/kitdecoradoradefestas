import { ChevronRight } from "lucide-react";
import { IconeInstagram } from "@/components/icone-instagram";
import { IconeWhatsapp } from "@/components/icone-whatsapp";
import { INSTAGRAM_URL, linkWhatsapp, WHATSAPP_NUMERO, whatsappLegivel } from "@/lib/config";

const MENSAGEM = "Olá! Não estou conseguindo entrar na Biblioteca Visual da Decoradora de Festas.";

/** Do link do perfil tira o @: .../decorar.semcomplicacao/ -> @decorar.semcomplicacao */
function arroba(url: string) {
  const usuario = url.replace(/\/+$/, "").split("/").pop();
  return usuario ? `@${usuario}` : "Instagram";
}

/** Saída para quem travou na entrada: ninguém fica sem falar com a gente. */
export function CanaisAjuda() {
  if (!WHATSAPP_NUMERO && !INSTAGRAM_URL) return null;

  return (
    <section className="mt-12 border-t border-linha pt-8">
      <h2 className="text-center font-titulo text-lg leading-tight font-bold">
        Com dificuldade para entrar?
      </h2>
      <p className="mx-auto mt-2 max-w-[17rem] text-center text-sm leading-relaxed text-ameixa/60">
        Chama a gente por aqui que a gente resolve o seu acesso.
      </p>

      <div className="mt-6 grid gap-3">
        {WHATSAPP_NUMERO && (
          <a
            href={linkWhatsapp(MENSAGEM)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-16 items-center gap-3 rounded-2xl bg-menta px-4 py-3 text-white shadow-[0_10px_24px_-12px_rgba(31,122,90,0.7)] transition active:brightness-95"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
              <IconeWhatsapp className="size-[22px]" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Falar no WhatsApp</span>
              <span className="block text-sm text-white/80">{whatsappLegivel()}</span>
            </span>
            <ChevronRight className="size-5 text-white/70" aria-hidden="true" />
          </a>
        )}

        {INSTAGRAM_URL && (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-linha transition active:bg-papel"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-framboesa/10 text-framboesa">
              <IconeInstagram className="size-[22px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Chamar no Instagram</span>
              <span className="block truncate text-sm text-ameixa/60">{arroba(INSTAGRAM_URL)}</span>
            </span>
            <ChevronRight className="size-5 text-ameixa/35" aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}
