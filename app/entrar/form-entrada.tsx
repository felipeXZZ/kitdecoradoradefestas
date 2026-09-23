"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { IconeWhatsapp } from "@/components/icone-whatsapp";
import { linkWhatsapp } from "@/lib/config";
import { entrar, type EstadoEntrada } from "./actions";

export function FormEntrada() {
  const [estado, acao, enviando] = useActionState<EstadoEntrada, FormData>(entrar, {
    status: "inicial",
  });
  const emailAtual = "email" in estado ? estado.email : "";

  return (
    <form action={acao}>
      <label htmlFor="email" className="block font-titulo text-2xl leading-tight">
        Digite o e-mail que você usou na compra
      </label>
      <p className="mt-2 text-ameixa/70">Sem senha: é só o e-mail e você já entra.</p>

      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        defaultValue={emailAtual}
        key={emailAtual}
        placeholder="voce@email.com"
        className="mt-5 h-14 w-full rounded-xl border border-linha bg-white px-4 text-base placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none"
      />

      <button
        type="submit"
        disabled={enviando}
        className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-framboesa text-base font-semibold text-white transition active:bg-framboesa-escura disabled:opacity-70"
      >
        {enviando && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        Entrar
      </button>

      <div aria-live="polite">
        {estado.status === "sem_compra" && (
          <Aviso mensagem="Não encontramos esse e-mail. Use o mesmo e-mail da compra ou fale com o suporte." />
        )}
        {estado.status === "bloqueado" && (
          <Aviso mensagem="Esse acesso está suspenso. Fale com o suporte que a gente resolve." />
        )}
        {estado.status === "erro" && <Aviso mensagem={estado.mensagem} />}
      </div>
    </form>
  );
}

function Aviso({ mensagem }: { mensagem: string }) {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-xl border border-confete/60 bg-confete-claro p-4">
      <p className="flex-1 text-sm">{mensagem}</p>
      <a
        href={linkWhatsapp("Olá! Não consigo entrar no Kit da Decoradora.")}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com o suporte no WhatsApp"
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-menta text-white"
      >
        <IconeWhatsapp />
      </a>
    </div>
  );
}
