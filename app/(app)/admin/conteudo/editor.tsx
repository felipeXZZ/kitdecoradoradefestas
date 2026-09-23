"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { TIPOS_DOCUMENTO } from "@/lib/documentos";
import { CATEGORIAS } from "@/app/(app)/scripts/lista-scripts";
import { excluirScript, salvarModelo, salvarScript } from "./actions";

const INPUT =
  "h-12 w-full rounded-xl border border-linha bg-white px-3 text-base focus:border-framboesa focus:outline-none";
const AREA =
  "w-full rounded-xl border border-linha bg-white p-3 font-mono text-sm focus:border-framboesa focus:outline-none";

export type ScriptAdmin = {
  id: string;
  categoria: string;
  titulo: string;
  corpo: string;
  ordem: number;
  ativo: boolean;
};

export type ModeloAdmin = {
  tipo: string;
  titulo: string;
  descricao: string | null;
  corpo: string;
  ativo: boolean;
};

export function EditorConteudo({
  scripts,
  modelos,
}: {
  scripts: ScriptAdmin[];
  modelos: ModeloAdmin[];
}) {
  const [aba, setAba] = useState<"scripts" | "documentos">("scripts");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-titulo text-2xl">Conteúdo das ferramentas</h1>
      <p className="mt-1 text-ameixa/70">Scripts de WhatsApp e modelos de documento.</p>

      <div className="mt-4 flex gap-2">
        {(["scripts", "documentos"] as const).map((chave) => (
          <button
            key={chave}
            type="button"
            onClick={() => setAba(chave)}
            aria-pressed={aba === chave}
            className={`h-11 flex-1 rounded-xl text-sm font-semibold ${
              aba === chave ? "bg-framboesa text-white" : "border border-linha bg-white"
            }`}
          >
            {chave === "scripts" ? "Scripts" : "Documentos"}
          </button>
        ))}
      </div>

      {aba === "scripts" ? (
        <AbaScripts scripts={scripts} />
      ) : (
        <AbaDocumentos modelos={modelos} />
      )}
    </div>
  );
}

function AbaScripts({ scripts }: { scripts: ScriptAdmin[] }) {
  const [novo, setNovo] = useState(false);
  return (
    <div className="mt-4 grid gap-3">
      {scripts.map((s) => (
        <FormScript key={s.id} script={s} />
      ))}

      {novo ? (
        <FormScript
          script={{ id: "", categoria: CATEGORIAS[0].chave, titulo: "", corpo: "", ordem: 0, ativo: true }}
          aoSalvar={() => setNovo(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setNovo(true)}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-framboesa/50 font-semibold text-framboesa"
        >
          <Plus className="size-5" aria-hidden="true" />
          Novo script
        </button>
      )}
    </div>
  );
}

function FormScript({ script, aoSalvar }: { script: ScriptAdmin; aoSalvar?: () => void }) {
  const [dados, setDados] = useState(script);
  const [estado, setEstado] = useState<"parado" | "salvo" | string>("parado");
  const [ocupado, iniciar] = useTransition();
  const mudar = (p: Partial<ScriptAdmin>) => {
    setEstado("parado");
    setDados((d) => ({ ...d, ...p }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await salvarScript({ ...dados, id: dados.id || undefined });
          setEstado(r.ok ? "salvo" : r.mensagem);
          if (r.ok) aoSalvar?.();
        });
      }}
      className="grid gap-3 rounded-2xl border border-linha bg-white p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Categoria</span>
          <select
            className={INPUT}
            value={dados.categoria}
            onChange={(e) => mudar({ categoria: e.target.value })}
          >
            {CATEGORIAS.map((c) => (
              <option key={c.chave} value={c.chave}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Ordem</span>
          <input
            type="number"
            className={INPUT}
            value={dados.ordem}
            onChange={(e) => mudar({ ordem: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Título</span>
        <input className={INPUT} value={dados.titulo} onChange={(e) => mudar({ titulo: e.target.value })} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">
          Texto — use {"{{cliente_nome}}"} e {"{{nome_negocio}}"}
        </span>
        <textarea
          rows={7}
          className={AREA}
          value={dados.corpo}
          onChange={(e) => mudar({ corpo: e.target.value })}
        />
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-framboesa"
          checked={dados.ativo}
          onChange={(e) => mudar({ ativo: e.target.checked })}
        />
        <span className="font-semibold">Ativo</span>
      </label>

      {estado !== "parado" && estado !== "salvo" && (
        <p role="alert" className="rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
          {estado}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={ocupado}
          className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold text-white ${
            estado === "salvo" ? "bg-menta" : "bg-framboesa"
          }`}
        >
          {ocupado && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          {estado === "salvo" && !ocupado && <Check className="size-5" aria-hidden="true" />}
          {estado === "salvo" && !ocupado ? "Salvo" : "Salvar"}
        </button>
        {dados.id && (
          <button
            type="button"
            onClick={() => {
              if (!confirm("Excluir este script?")) return;
              iniciar(async () => {
                const r = await excluirScript(dados.id);
                if (!r.ok) setEstado(r.mensagem);
              });
            }}
            aria-label="Excluir script"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-linha text-ameixa/60"
          >
            <Trash2 className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}

function AbaDocumentos({ modelos }: { modelos: ModeloAdmin[] }) {
  return (
    <div className="mt-4 grid gap-3">
      <p className="rounded-xl bg-confete-claro px-4 py-3 text-sm">
        Contrato e termo de responsabilidade só devem ser publicados com texto revisado por um
        advogado. Modelo de linguagem não escreve documento jurídico.
      </p>

      {TIPOS_DOCUMENTO.map((tipo) => {
        const atual = modelos.find((m) => m.tipo === tipo.tipo);
        return (
          <FormModelo
            key={tipo.tipo}
            modelo={
              atual ?? {
                tipo: tipo.tipo,
                titulo: tipo.titulo,
                descricao: tipo.descricao,
                corpo: "",
                ativo: false,
              }
            }
            existe={Boolean(atual)}
          />
        );
      })}
    </div>
  );
}

function FormModelo({ modelo, existe }: { modelo: ModeloAdmin; existe: boolean }) {
  const [dados, setDados] = useState({ ...modelo, descricao: modelo.descricao ?? "" });
  const [estado, setEstado] = useState<"parado" | "salvo" | string>("parado");
  const [ocupado, iniciar] = useTransition();
  const mudar = (p: Partial<typeof dados>) => {
    setEstado("parado");
    setDados((d) => ({ ...d, ...p }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await salvarModelo(dados);
          setEstado(r.ok ? "salvo" : r.mensagem);
        });
      }}
      className="grid gap-3 rounded-2xl border border-linha bg-white p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{dados.titulo}</h2>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            existe && dados.ativo ? "bg-menta/10 text-menta" : "bg-confete-claro text-ameixa"
          }`}
        >
          {existe && dados.ativo ? "No ar" : "Em breve"}
        </span>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Descrição</span>
        <input
          className={INPUT}
          value={dados.descricao}
          onChange={(e) => mudar({ descricao: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">
          Texto — variáveis: {"{{cliente_nome}}"}, {"{{data_festa}}"}, {"{{local_festa}}"},{" "}
          {"{{valor_total}}"}, {"{{valor_sinal}}"}, {"{{valor_saldo}}"}, {"{{nome_negocio}}"},{" "}
          {"{{nome_responsavel}}"}, {"{{cidade}}"}, {"{{data_hoje}}"}
        </span>
        <textarea
          rows={10}
          className={AREA}
          value={dados.corpo}
          onChange={(e) => mudar({ corpo: e.target.value })}
        />
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-framboesa"
          checked={dados.ativo}
          onChange={(e) => mudar({ ativo: e.target.checked })}
        />
        <span className="font-semibold">Publicar para as clientes</span>
      </label>

      {estado !== "parado" && estado !== "salvo" && (
        <p role="alert" className="rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
          {estado}
        </p>
      )}

      <button
        type="submit"
        disabled={ocupado}
        className={`flex h-12 items-center justify-center gap-2 rounded-xl font-semibold text-white ${
          estado === "salvo" ? "bg-menta" : "bg-framboesa"
        }`}
      >
        {ocupado && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {estado === "salvo" && !ocupado && <Check className="size-5" aria-hidden="true" />}
        {estado === "salvo" && !ocupado ? "Salvo" : "Salvar"}
      </button>
    </form>
  );
}
