"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy, Download, Loader2, X } from "lucide-react";
import { IconeWhatsapp } from "@/components/icone-whatsapp";
import type { StatusOrcamento } from "@/lib/orcamentos";
import { linkDoOrcamento, mudarStatus } from "../actions";

type Props = {
  id: string;
  numero: number;
  clienteNome: string;
  clienteTelefone: string | null;
  validade: string;
  status: StatusOrcamento;
  link: string | null;
};

export function AcoesOrcamento({
  id,
  numero,
  clienteNome,
  clienteTelefone,
  validade,
  status,
  link,
}: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  async function urlDoPdf() {
    if (link) return link;
    const novo = await linkDoOrcamento(id);
    if (!novo) setErro("Não conseguimos gerar o PDF agora. Tente de novo.");
    return novo;
  }

  async function baixar() {
    setErro(null);
    const url = await urlDoPdf();
    if (url) window.open(url, "_blank", "noopener");
  }

  /**
   * O wa.me não anexa arquivo. No celular manda o PDF de verdade pela Web Share
   * API; no computador abre o WhatsApp com a mensagem e o link.
   */
  async function enviarWhatsapp() {
    setErro(null);
    const url = await urlDoPdf();
    if (!url) return;

    const validadeBR = validade.slice(0, 10).split("-").reverse().join("/");
    const mensagem = `Oi ${clienteNome}! Segue o orçamento da sua festa: ${url}\nEle vale até ${validadeBR}. Qualquer dúvida é só me chamar.`;

    try {
      const resposta = await fetch(url);
      const blob = await resposta.blob();
      const arquivo = new File([blob], `orcamento-${numero}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({
          files: [arquivo],
          text: `Oi ${clienteNome}! Segue o orçamento da sua festa. Ele vale até ${validadeBR}.`,
        });
        return;
      }
    } catch {
      // Compartilhamento cancelado ou indisponível: cai no wa.me abaixo.
    }

    const numeroLimpo = (clienteTelefone ?? "").replace(/\D/g, "");
    const destino = numeroLimpo ? `55${numeroLimpo}` : "";
    window.open(
      `https://wa.me/${destino}?text=${encodeURIComponent(mensagem)}`,
      "_blank",
      "noopener",
    );
  }

  function marcar(novo: StatusOrcamento) {
    setErro(null);
    iniciar(async () => {
      const r = await mudarStatus(id, novo);
      if (!r.ok) setErro(r.mensagem);
    });
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={enviarWhatsapp}
        className="flex h-14 items-center justify-center gap-2 rounded-xl bg-menta text-base font-semibold text-white"
      >
        <IconeWhatsapp className="size-5" />
        Enviar no WhatsApp
      </button>

      <button
        type="button"
        onClick={baixar}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-linha bg-white font-semibold"
      >
        <Download className="size-5" aria-hidden="true" />
        Baixar PDF
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={ocupado || status === "aceito"}
          onClick={() => marcar("aceito")}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-linha bg-white font-semibold text-menta disabled:opacity-40"
        >
          {ocupado ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-5" aria-hidden="true" />
          )}
          Aceito
        </button>
        <button
          type="button"
          disabled={ocupado || status === "recusado"}
          onClick={() => marcar("recusado")}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-linha bg-white font-semibold text-ameixa/70 disabled:opacity-40"
        >
          <X className="size-5" aria-hidden="true" />
          Recusado
        </button>
      </div>

      <Link
        href={`/orcamentos/novo?duplicar=${id}`}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-linha bg-white font-semibold"
      >
        <Copy className="size-5" aria-hidden="true" />
        Duplicar para outro cliente
      </Link>

      {erro && (
        <p role="alert" className="rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
          {erro}
        </p>
      )}
    </div>
  );
}
