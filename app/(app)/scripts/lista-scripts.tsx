"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { IconeWhatsapp } from "@/components/icone-whatsapp";

export type Script = { id: string; categoria: string; titulo: string; corpo: string };

export const CATEGORIAS = [
  { chave: "orcamento", rotulo: "Primeiro contato" },
  { chave: "objecao", rotulo: "“Tá caro”" },
  { chave: "sinal", rotulo: "Sinal" },
  { chave: "followup", rotulo: "Follow-up" },
  { chave: "indicacao", rotulo: "Indicação" },
] as const;

export function ListaScripts({ scripts, nomeNegocio }: { scripts: Script[]; nomeNegocio: string }) {
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0].chave);
  const [cliente, setCliente] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);

  const preencher = (corpo: string) =>
    corpo
      .replace(/\{\{\s*cliente_nome\s*\}\}/gi, cliente.trim() || "[nome do cliente]")
      .replace(/\{\{\s*nome_negocio\s*\}\}/gi, nomeNegocio);

  const daCategoria = scripts.filter((s) => s.categoria === categoria);

  async function copiar(script: Script) {
    const texto = preencher(script.corpo);
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Navegador antigo ou sem permissão: seleciona para ela copiar na mão.
      const area = document.createElement("textarea");
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopiado(script.id);
    setTimeout(() => setCopiado((atual) => (atual === script.id ? null : atual)), 2000);
  }

  function abrirWhatsapp(script: Script) {
    const telefone = prompt("Telefone do cliente com DDD (só números):", "");
    if (telefone === null) return;
    const numero = telefone.replace(/\D/g, "");
    const destino = numero ? `55${numero.replace(/^55/, "")}` : "";
    window.open(
      `https://wa.me/${destino}?text=${encodeURIComponent(preencher(script.corpo))}`,
      "_blank",
      "noopener",
    );
  }

  return (
    <section>
      <h1 className="font-titulo text-2xl">Scripts</h1>
      <p className="mt-1 text-ameixa/70">O que responder, sem travar na frente da mensagem.</p>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-semibold">Nome do cliente (opcional)</span>
        <input
          placeholder="Mariana"
          className="h-12 w-full rounded-xl border border-linha bg-white px-3 text-base placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
      </label>

      <div className="-mx-4 mt-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2 pb-1">
          {CATEGORIAS.map((c) => (
            <button
              key={c.chave}
              type="button"
              onClick={() => setCategoria(c.chave)}
              aria-pressed={categoria === c.chave}
              className={`h-11 rounded-full px-4 text-sm font-semibold whitespace-nowrap ${
                categoria === c.chave
                  ? "bg-framboesa text-white"
                  : "border border-linha bg-white text-ameixa/70"
              }`}
            >
              {c.rotulo}
            </button>
          ))}
        </div>
      </div>

      {daCategoria.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-linha bg-white px-5 py-8 text-center text-ameixa/70">
          Nenhum script nesta categoria ainda.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {daCategoria.map((script) => (
            <li key={script.id} className="rounded-2xl border border-linha bg-white p-4">
              <h2 className="font-semibold">{script.titulo}</h2>
              <p className="mt-2 text-sm whitespace-pre-line text-ameixa/80">
                {preencher(script.corpo)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copiar(script)}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold ${
                    copiado === script.id ? "bg-menta text-white" : "bg-framboesa text-white"
                  }`}
                >
                  {copiado === script.id ? (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" aria-hidden="true" />
                      Copiar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => abrirWhatsapp(script)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-linha text-sm font-semibold"
                >
                  <IconeWhatsapp className="size-4" />
                  Abrir no WhatsApp
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
