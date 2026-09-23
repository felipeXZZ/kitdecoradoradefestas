import { IconeInstagram } from "@/components/icone-instagram";
import { IconeWhatsapp } from "@/components/icone-whatsapp";
import { INSTAGRAM_URL, linkWhatsapp, WHATSAPP_NUMERO, whatsappLegivel } from "@/lib/config";

const MENSAGEM = "Olá! Não estou conseguindo entrar no Kit da Decoradora.";

/** Do link do perfil tira o @: .../decorar.semcomplicacao/ -> @decorar.semcomplicacao */
function arroba(url: string) {
  const usuario = url.replace(/\/+$/, "").split("/").pop();
  return usuario ? `@${usuario}` : "Instagram";
}

/** Saída para quem travou na entrada: ninguém fica sem falar com a gente. */
export function CanaisAjuda() {
  if (!WHATSAPP_NUMERO && !INSTAGRAM_URL) return null;

  return (
    <section className="mt-10 rounded-2xl border border-linha bg-white p-4">
      <h2 className="font-semibold">Com dificuldade para entrar?</h2>
      <p className="mt-1 text-sm text-ameixa/70">
        Chama a gente por aqui que a gente resolve o seu acesso.
      </p>

      <div className="mt-3 grid gap-2">
        {WHATSAPP_NUMERO && (
          <a
            href={linkWhatsapp(MENSAGEM)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-menta text-sm font-semibold text-white"
          >
            <IconeWhatsapp className="size-5" />
            WhatsApp {whatsappLegivel()}
          </a>
        )}

        {INSTAGRAM_URL && (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-linha text-sm font-semibold text-ameixa"
          >
            <IconeInstagram className="size-5 text-framboesa" />
            {arroba(INSTAGRAM_URL)}
          </a>
        )}
      </div>
    </section>
  );
}
