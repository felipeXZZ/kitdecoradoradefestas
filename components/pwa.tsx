"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Share, SquarePlus, X } from "lucide-react";

const CHAVE_DISPENSADO = "kd:instalar-dispensado";

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Registra o service worker (só em produção, para não atrapalhar o dev). */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("[sw]", e));
  }, []);
  return null;
}

/**
 * Faixa discreta "Instale na tela inicial". Android usa o beforeinstallprompt;
 * iPhone não tem esse evento, então abre as instruções do Safari.
 */
export function FaixaInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [ios, setIos] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const [instrucoes, setInstrucoes] = useState(false);
  // Na calculadora a faixa cobriria o botão "Próximo".
  const naCalculadora = usePathname().startsWith("/calculadora");

  useEffect(() => {
    const instalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dispensado = false;
    try {
      dispensado = localStorage.getItem(CHAVE_DISPENSADO) === "1";
    } catch {}
    if (instalado || dispensado) return;

    const ehIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (ehIos) {
      setIos(true);
      setVisivel(true);
    }

    const aoPoderInstalar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
      setVisivel(true);
    };
    const aoInstalar = () => setVisivel(false);
    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  function dispensar() {
    setVisivel(false);
    try {
      localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {}
  }

  async function instalar() {
    if (evento) {
      await evento.prompt();
      const { outcome } = await evento.userChoice;
      setEvento(null);
      if (outcome === "accepted") setVisivel(false);
    } else if (ios) {
      setInstrucoes(true);
    }
  }

  if (!visivel || naCalculadora) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 px-3 pb-2">
      <div className="mx-auto max-w-md rounded-2xl border border-linha bg-white p-3 shadow-lg">
        {instrucoes ? (
          <div>
            <div className="flex items-start justify-between">
              <p className="font-semibold">Instalar no iPhone</p>
              <BotaoFechar onClick={dispensar} />
            </div>
            <ol className="mt-1 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                1. Toque em <Share className="size-5 text-framboesa" aria-label="Compartilhar" /> na barra do Safari
              </li>
              <li className="flex items-center gap-2">
                2. Escolha <SquarePlus className="size-5 text-framboesa" aria-hidden="true" /> “Adicionar à Tela de
                Início”
              </li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Download className="size-5 shrink-0 text-framboesa" aria-hidden="true" />
            <p className="flex-1 text-sm">Instale na tela inicial e use como aplicativo</p>
            <button
              type="button"
              onClick={instalar}
              className="h-11 shrink-0 rounded-xl bg-framboesa px-4 text-sm font-semibold text-white"
            >
              Instalar
            </button>
            <BotaoFechar onClick={dispensar} />
          </div>
        )}
      </div>
    </div>
  );
}

function BotaoFechar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Agora não"
      className="-mr-1 grid size-11 shrink-0 place-items-center rounded-full text-ameixa/50 active:bg-linha"
    >
      <X className="size-5" aria-hidden="true" />
    </button>
  );
}
