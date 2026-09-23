"use client";

import { useRef, useState, useTransition } from "react";
import { Download, FileText, Loader2, X } from "lucide-react";
import { brl } from "@/lib/formato";
import { TIPOS_DOCUMENTO } from "@/lib/documentos";
import { gerarDocumento } from "./actions";

const INPUT =
  "h-12 w-full rounded-xl border border-linha bg-white px-3 text-base placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none";

export type OrcamentoResumo = {
  id: string;
  numero: number;
  cliente_nome: string;
  valor_total: number;
};

export function ListaDocumentos({
  disponiveis,
  orcamentos,
}: {
  disponiveis: string[];
  orcamentos: OrcamentoResumo[];
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [tipo, setTipo] = useState<string | null>(null);

  const escolhido = TIPOS_DOCUMENTO.find((t) => t.tipo === tipo);

  return (
    <section>
      <h1 className="font-titulo text-2xl">Documentos</h1>
      <p className="mt-1 mb-4 text-ameixa/70">
        Gerados com os seus dados e, se quiser, com os dados de um orçamento.
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {TIPOS_DOCUMENTO.map((doc) => {
          const pronto = disponiveis.includes(doc.tipo);
          return (
            <li key={doc.tipo}>
              <button
                type="button"
                disabled={!pronto}
                onClick={() => {
                  setTipo(doc.tipo);
                  modalRef.current?.showModal();
                }}
                className={`flex w-full items-start gap-3 rounded-2xl border border-linha p-4 text-left ${
                  pronto ? "bg-white active:bg-papel" : "bg-white/60"
                }`}
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    pronto ? "bg-framboesa/10 text-framboesa" : "bg-linha/60 text-ameixa/40"
                  }`}
                >
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold ${pronto ? "" : "text-ameixa/50"}`}>
                    {doc.titulo}
                  </span>
                  <span className={`block text-sm ${pronto ? "text-ameixa/70" : "text-ameixa/50"}`}>
                    {doc.descricao}
                  </span>
                </span>
                {!pronto && (
                  <span className="shrink-0 rounded-full bg-confete-claro px-2.5 py-1 text-xs font-semibold">
                    Em breve
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-ameixa/70">
        Todo documento sai com a observação: “Modelo de referência. Recomendamos a revisão por um
        profissional de sua confiança.”
      </p>

      <dialog
        ref={modalRef}
        aria-labelledby="titulo-documento"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-papel p-0 text-ameixa backdrop:bg-ameixa/60 sm:m-auto sm:max-w-md sm:rounded-3xl"
      >
        {escolhido && (
          <FormDocumento
            key={escolhido.tipo}
            tipo={escolhido.tipo}
            titulo={escolhido.titulo}
            orcamentos={orcamentos}
            fechar={() => modalRef.current?.close()}
          />
        )}
      </dialog>
    </section>
  );
}

function FormDocumento({
  tipo,
  titulo,
  orcamentos,
  fechar,
}: {
  tipo: string;
  titulo: string;
  orcamentos: OrcamentoResumo[];
  fechar: () => void;
}) {
  const [orcamentoId, setOrcamentoId] = useState(orcamentos[0]?.id ?? "");
  const [naMao, setNaMao] = useState(orcamentos.length === 0);
  const [cliente, setCliente] = useState("");
  const [dataFesta, setDataFesta] = useState("");
  const [local, setLocal] = useState("");
  const [valor, setValor] = useState("");
  const [sinal, setSinal] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [gerando, iniciar] = useTransition();

  const dinheiro = (v: string) => Number(v.replace(/\D/g, "") || 0) / 100;

  function gerar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await gerarDocumento({
        tipo,
        orcamento_id: naMao ? "" : orcamentoId,
        cliente_nome: cliente,
        data_festa: dataFesta,
        local_festa: local,
        valor_total: dinheiro(valor),
        valor_sinal: dinheiro(sinal),
      });
      if (!r.ok) return setErro(r.mensagem);
      setLink(r.link);
      window.open(r.link, "_blank", "noopener");
    });
  }

  return (
    <form onSubmit={gerar} className="pb-seguro p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 id="titulo-documento" className="font-titulo text-2xl leading-tight">
          {titulo}
        </h2>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="-mt-1 -mr-2 grid size-11 place-items-center rounded-full text-ameixa/60 active:bg-linha"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
      </div>

      {orcamentos.length > 0 && (
        <div className="mt-4 grid gap-2">
          <span className="text-sm font-semibold">Preencher com qual orçamento?</span>
          <select
            className={INPUT}
            value={naMao ? "mao" : orcamentoId}
            onChange={(e) => {
              setNaMao(e.target.value === "mao");
              if (e.target.value !== "mao") setOrcamentoId(e.target.value);
            }}
          >
            {orcamentos.map((o) => (
              <option key={o.id} value={o.id}>
                nº {o.numero} · {o.cliente_nome} · {brl(o.valor_total)}
              </option>
            ))}
            <option value="mao">Preencher na mão</option>
          </select>
        </div>
      )}

      {naMao && (
        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Nome do cliente</span>
            <input required className={INPUT} value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Data da festa</span>
            <input type="date" className={INPUT} value={dataFesta} onChange={(e) => setDataFesta(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Local</span>
            <input className={INPUT} value={local} onChange={(e) => setLocal(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Valor total</span>
              <input
                inputMode="decimal"
                placeholder="R$ 0,00"
                className={INPUT}
                value={valor ? brl(dinheiro(valor)) : ""}
                onChange={(e) => setValor(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Sinal</span>
              <input
                inputMode="decimal"
                placeholder="R$ 0,00"
                className={INPUT}
                value={sinal ? brl(dinheiro(sinal)) : ""}
                onChange={(e) => setSinal(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      {erro && (
        <p role="alert" className="mt-3 rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={gerando}
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-framboesa text-base font-semibold text-white disabled:opacity-70"
      >
        {gerando ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-5" aria-hidden="true" />
        )}
        Gerar PDF
      </button>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex h-12 items-center justify-center rounded-xl border border-linha bg-white font-semibold"
        >
          Abrir de novo
        </a>
      )}
    </form>
  );
}
