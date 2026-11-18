"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { IconeWhatsapp } from "@/components/icone-whatsapp";
import { linkWhatsapp } from "@/lib/config";
import { entrar, type EstadoEntrada } from "./actions";

export function FormEntrada() {
  const [estado, acao, enviando] = useActionState<EstadoEntrada, FormData>(entrar, {
    status: "inicial",
  });
  const emailAtual = "email" in estado ? estado.email : "";

  return (
    <form
      action={acao}
      className="rounded-3xl bg-white p-5 shadow-[0_1px_0_rgba(43,27,46,0.04),0_16px_40px_-16px_rgba(43,27,46,0.28)] ring-1 ring-linha"
    >
      <label htmlFor="email" className="block font-titulo text-xl leading-tight font-bold">
        Entre com seu e-mail
      </label>
      <p className="mt-2 text-sm leading-relaxed text-ameixa/70">
        Use o <strong className="font-semibold text-ameixa">mesmo e-mail da compra do 150 Festas na Mesa</strong>.
        Seu acesso à Biblioteca já está liberado nele.
      </p>

      <div className="relative mt-5">
        <Mail
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ameixa/35"
          aria-hidden="true"
        />
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
          className="h-14 w-full rounded-xl border border-linha bg-papel pr-4 pl-12 text-base transition placeholder:text-ameixa/35 focus:border-framboesa focus:bg-white focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-framboesa text-base font-semibold text-white transition active:bg-framboesa-escura disabled:opacity-70"
      >
        {enviando ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Entrando…
          </>
        ) : (
          <>
            Entrar
            <ArrowRight className="size-5" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-ameixa/55">Sem senha. Digitou, entrou.</p>

      <div aria-live="polite">
        {estado.status === "sem_compra" && (
          <Aviso mensagem="Não encontramos esse e-mail. Confira se é o mesmo da compra do 150 Festas na Mesa ou fale com o suporte." />
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
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-confete/60 bg-confete-claro p-4">
      <p className="flex-1 text-sm">{mensagem}</p>
      <a
        href={linkWhatsapp("Olá! Não consigo entrar na Biblioteca Visual da Decoradora de Festas.")}
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
