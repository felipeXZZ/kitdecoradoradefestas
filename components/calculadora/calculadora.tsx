"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ChevronLeft, Plus, Trash2, X } from "lucide-react";
import {
  calcular,
  dadosVazios,
  normalizarNegocio,
  somaHoras,
  somaMateriais,
  somaReutilizavel,
  type Dados,
  type Negocio,
} from "@/lib/calculo";
import { brl, numero } from "@/lib/formato";
import { obterCalculo, salvarCalculo } from "@/lib/historico-local";
import { CampoDinheiro, CampoNumero, CampoTexto } from "./campos";
import { TelaResultado } from "./tela-resultado";

const CHAVE_NEGOCIO = "kd:negocio";

const PASSOS = [
  { titulo: "Materiais de consumo", texto: "Tudo o que é gasto e não volta: flores, balões, tecidos, doces." },
  { titulo: "Material reutilizável", texto: "Peças que você usa em várias festas: painéis, mesas, boleiras." },
  { titulo: "Seu tempo", texto: "Seu trabalho também é custo. Conte todas as horas desta festa." },
  { titulo: "Custos da festa", texto: "O que você gasta só para chegar e montar esta festa." },
  { titulo: "Seu negócio", texto: "Guardamos esses valores para os próximos cálculos." },
] as const;

export function Calculadora() {
  const duplicarId = useSearchParams().get("duplicar");
  const [dados, setDados] = useState<Dados>(dadosVazios);
  const [origem, setOrigem] = useState<string | null>(null);
  const [passo, setPasso] = useState(0);
  const [salvoId, setSalvoId] = useState<string | null>(null);
  const primeiraCarga = useRef(true);

  // "Duplicar" traz os campos de um cálculo do aparelho; senão valem os
  // padrões do passo "Seu negócio" guardados no último cálculo.
  useEffect(() => {
    if (duplicarId) {
      const salvo = obterCalculo(duplicarId);
      if (salvo) {
        setDados(salvo.dados);
        setOrigem(salvo.nome);
        return;
      }
    }
    try {
      const salvo = localStorage.getItem(CHAVE_NEGOCIO);
      if (salvo) setDados((d) => ({ ...d, negocio: normalizarNegocio(JSON.parse(salvo)) }));
    } catch {}
  }, [duplicarId]);

  useEffect(() => {
    // Pula a primeira passada para não gravar os padrões antes de carregá-los.
    if (primeiraCarga.current) {
      primeiraCarga.current = false;
      return;
    }
    try {
      localStorage.setItem(CHAVE_NEGOCIO, JSON.stringify(dados.negocio));
    } catch {}
  }, [dados.negocio]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [passo]);

  const calculo = calcular(dados);
  const noResultado = passo === PASSOS.length;

  function novoCalculo() {
    setDados((d) => dadosVazios(d.negocio));
    setSalvoId(null);
    setPasso(0);
  }

  if (noResultado && calculo.ok) {
    return (
      <TelaResultado resultado={calculo.resultado}>
        {salvoId ? (
          <Link
            href={`/historico/${salvoId}`}
            className="flex h-14 items-center justify-center gap-2 rounded-xl bg-menta font-semibold text-white"
          >
            <Check className="size-5" aria-hidden="true" />
            Salvo — ver no histórico
          </Link>
        ) : (
          <BotaoSalvar dados={dados} sugestao={origem ?? undefined} onSalvo={setSalvoId} />
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPasso(PASSOS.length - 1)}
            className="h-12 rounded-xl border border-linha bg-white font-semibold"
          >
            Editar valores
          </button>
          <button
            type="button"
            onClick={novoCalculo}
            className="h-12 rounded-xl border border-linha bg-white font-semibold"
          >
            Novo cálculo
          </button>
        </div>
      </TelaResultado>
    );
  }

  const atualizar = <K extends keyof Dados>(chave: K, valor: Dados[K]) =>
    setDados((d) => ({ ...d, [chave]: valor }));

  const { titulo, texto } = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  return (
    <div>
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">
            Passo {passo + 1} de {PASSOS.length}
          </span>
          {origem && <span className="truncate pl-4 text-ameixa/60">Cópia de {origem}</span>}
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-linha"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={PASSOS.length}
          aria-valuenow={passo + 1}
          aria-label="Progresso do cálculo"
        >
          <div
            className="h-full rounded-full bg-framboesa transition-all"
            style={{ width: `${((passo + 1) / PASSOS.length) * 100}%` }}
          />
        </div>
      </div>

      <h1 className="font-titulo text-2xl leading-tight">{titulo}</h1>
      <p className="mt-1 mb-5 text-ameixa/70">{texto}</p>

      <div className="mx-auto max-w-xl">
        {passo === 0 && <PassoMateriais dados={dados} atualizar={atualizar} />}
        {passo === 1 && <PassoReutilizavel dados={dados} atualizar={atualizar} />}
        {passo === 2 && <PassoTempo dados={dados} atualizar={atualizar} />}
        {passo === 3 && <PassoFesta dados={dados} atualizar={atualizar} />}
        {passo === 4 && <PassoNegocio negocio={dados.negocio} onChange={(n) => atualizar("negocio", n)} />}
      </div>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 mt-6 border-t border-linha bg-papel/95 px-4 pt-3 pb-3 backdrop-blur">
        <div className="mx-auto max-w-xl">
          <Parcial passo={passo} dados={dados} />
          {ultimo && !calculo.ok && (
            <p role="alert" className="mb-2 rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
              {calculo.erro}
            </p>
          )}
          <div className="flex gap-2">
            {passo > 0 && (
              <button
                type="button"
                onClick={() => setPasso(passo - 1)}
                aria-label="Voltar ao passo anterior"
                className="grid size-14 shrink-0 place-items-center rounded-xl border border-linha bg-white"
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              disabled={ultimo && !calculo.ok}
              onClick={() => setPasso(passo + 1)}
              className="h-14 flex-1 rounded-xl bg-framboesa text-base font-semibold text-white active:bg-framboesa-escura disabled:opacity-50"
            >
              {ultimo ? "Calcular preço" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

type PropsPasso = {
  dados: Dados;
  atualizar: <K extends keyof Dados>(chave: K, valor: Dados[K]) => void;
};

function Parcial({ passo, dados }: { passo: number; dados: Dados }) {
  const parciais: [string, string][] = [
    ["Total de materiais", brl(somaMateriais(dados.materiais))],
    ["Entra nesta festa", brl(somaReutilizavel(dados.reutilizaveis))],
    ["Total de horas", `${numero(somaHoras(dados.tempo))} h`],
  ];
  const parcial = parciais[passo];
  if (!parcial) return null;
  return (
    <p className="mb-2 flex items-baseline justify-between" aria-live="polite">
      <span className="text-sm text-ameixa/70">{parcial[0]}</span>
      <span className="font-titulo text-xl tabular-nums">{parcial[1]}</span>
    </p>
  );
}

function BotaoRemover({ onClick, rotulo }: { onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="grid size-11 shrink-0 place-items-center rounded-full text-ameixa/50 active:bg-linha"
    >
      <Trash2 className="size-5" aria-hidden="true" />
    </button>
  );
}

function BotaoAdicionar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-framboesa/50 font-semibold text-framboesa active:bg-framboesa/5"
    >
      <Plus className="size-5" aria-hidden="true" />
      Adicionar item
    </button>
  );
}

function PassoMateriais({ dados, atualizar }: PropsPasso) {
  const itens = dados.materiais;
  const mudar = (i: number, parcial: Partial<(typeof itens)[number]>) =>
    atualizar("materiais", itens.map((item, j) => (j === i ? { ...item, ...parcial } : item)));

  return (
    <div className="space-y-3">
      {itens.map((item, i) => (
        <fieldset key={i} className="rounded-2xl border border-linha bg-white p-3">
          <legend className="sr-only">Item {i + 1}</legend>
          <div className="flex items-end gap-1">
            <div className="flex-1">
              <CampoTexto
                rotulo="Item"
                placeholder="Ex: balão 9 polegadas"
                valor={item.nome}
                onChange={(nome) => mudar(i, { nome })}
              />
            </div>
            <BotaoRemover
              rotulo={`Remover item ${i + 1}`}
              onClick={() => atualizar("materiais", itens.filter((_, j) => j !== i))}
            />
          </div>
          <div className="mt-2 grid grid-cols-[5.5rem_1fr] gap-2">
            <CampoNumero rotulo="Qtd." valor={item.quantidade} onChange={(quantidade) => mudar(i, { quantidade })} />
            <CampoDinheiro rotulo="Custo unitário" valor={item.custo} onChange={(custo) => mudar(i, { custo })} />
          </div>
        </fieldset>
      ))}
      <BotaoAdicionar onClick={() => atualizar("materiais", [...itens, { nome: "", quantidade: 1, custo: 0 }])} />
    </div>
  );
}

function PassoReutilizavel({ dados, atualizar }: PropsPasso) {
  const itens = dados.reutilizaveis;
  const mudar = (i: number, parcial: Partial<(typeof itens)[number]>) =>
    atualizar("reutilizaveis", itens.map((item, j) => (j === i ? { ...item, ...parcial } : item)));

  return (
    <div className="space-y-3">
      {itens.map((item, i) => (
        <fieldset key={i} className="rounded-2xl border border-linha bg-white p-3">
          <legend className="sr-only">Item {i + 1}</legend>
          <div className="flex items-end gap-1">
            <div className="flex-1">
              <CampoTexto
                rotulo="Item"
                placeholder="Ex: painel redondo"
                valor={item.nome}
                onChange={(nome) => mudar(i, { nome })}
              />
            </div>
            <BotaoRemover
              rotulo={`Remover item ${i + 1}`}
              onClick={() => atualizar("reutilizaveis", itens.filter((_, j) => j !== i))}
            />
          </div>
          <div className="mt-2 grid grid-cols-[1fr_6.5rem] gap-2">
            <CampoDinheiro rotulo="Valor do item" valor={item.valor} onChange={(valor) => mudar(i, { valor })} />
            <CampoNumero rotulo="Usos" sufixo="x" valor={item.usos} onChange={(usos) => mudar(i, { usos })} />
          </div>
          {item.valor > 0 && (
            <p className="mt-2 text-sm text-ameixa/70">
              {item.usos > 0 ? (
                <>
                  Entra <strong className="text-ameixa">{brl(item.valor / item.usos)}</strong> nesta festa
                </>
              ) : (
                "Informe em quantas festas você vai usar."
              )}
            </p>
          )}
        </fieldset>
      ))}
      <BotaoAdicionar
        onClick={() => atualizar("reutilizaveis", [...itens, { nome: "", valor: 0, usos: 10 }])}
      />
      <p className="rounded-xl bg-white px-4 py-3 text-sm text-ameixa/70">
        Um painel de R$ 400 que você usa em 10 festas custa R$ 40 nesta festa. É assim que ele tem que
        entrar na conta.
      </p>
    </div>
  );
}

function PassoTempo({ dados, atualizar }: PropsPasso) {
  const t = dados.tempo;
  const mudar = (parcial: Partial<typeof t>) => atualizar("tempo", { ...t, ...parcial });
  return (
    <div className="grid gap-4">
      <CampoNumero
        rotulo="Horas de planejamento e compras"
        sufixo="h"
        valor={t.planejamento}
        onChange={(planejamento) => mudar({ planejamento })}
      />
      <div className="grid grid-cols-2 gap-3">
        <CampoNumero rotulo="Horas de montagem" sufixo="h" valor={t.montagem} onChange={(montagem) => mudar({ montagem })} />
        <CampoNumero
          rotulo="Horas de desmontagem"
          sufixo="h"
          valor={t.desmontagem}
          onChange={(desmontagem) => mudar({ desmontagem })}
        />
      </div>
      <CampoDinheiro rotulo="Valor da sua hora" valor={t.valorHora} onChange={(valorHora) => mudar({ valorHora })} />
    </div>
  );
}

function PassoFesta({ dados, atualizar }: PropsPasso) {
  const f = dados.festa;
  const mudar = (parcial: Partial<typeof f>) => atualizar("festa", { ...f, ...parcial });
  return (
    <div className="grid gap-4">
      <CampoDinheiro rotulo="Diária do ajudante" valor={f.ajudante} onChange={(ajudante) => mudar({ ajudante })} />
      <div className="grid grid-cols-2 gap-3">
        <CampoNumero rotulo="Km ida e volta" sufixo="km" valor={f.km} onChange={(km) => mudar({ km })} />
        <CampoDinheiro rotulo="Custo por km" valor={f.custoKm} onChange={(custoKm) => mudar({ custoKm })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoDinheiro rotulo="Pedágio" valor={f.pedagio} onChange={(pedagio) => mudar({ pedagio })} />
        <CampoDinheiro
          rotulo="Estacionamento"
          valor={f.estacionamento}
          onChange={(estacionamento) => mudar({ estacionamento })}
        />
      </div>
    </div>
  );
}

function PassoNegocio({ negocio: n, onChange }: { negocio: Negocio; onChange: (n: Negocio) => void }) {
  const mudar = (parcial: Partial<Negocio>) => onChange({ ...n, ...parcial });
  return (
    <div className="grid gap-4">
      <CampoDinheiro
        rotulo="Custo fixo mensal"
        dica="Aluguel, internet, telefone, energia."
        valor={n.custoFixo}
        onChange={(custoFixo) => mudar({ custoFixo })}
      />
      <CampoNumero
        rotulo="Festas por mês"
        valor={n.festasMes}
        onChange={(festasMes) => mudar({ festasMes })}
        dica={n.festasMes > 0 && n.custoFixo > 0 ? `${brl(n.custoFixo / n.festasMes)} por festa` : undefined}
      />
      <CampoNumero rotulo="Margem de lucro desejada" sufixo="%" valor={n.margem} onChange={(margem) => mudar({ margem })} />
      <div className="grid grid-cols-2 gap-3">
        <CampoNumero
          rotulo="Taxa da maquininha"
          sufixo="%"
          valor={n.taxaMaquininha}
          onChange={(taxaMaquininha) => mudar({ taxaMaquininha })}
        />
        <CampoNumero rotulo="Imposto" sufixo="%" valor={n.imposto} onChange={(imposto) => mudar({ imposto })} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function BotaoSalvar({
  dados,
  sugestao,
  onSalvo,
}: {
  dados: Dados;
  sugestao?: string;
  onSalvo: (id: string) => void;
}) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [nome, setNome] = useState(sugestao ?? "");
  const [erro, setErro] = useState<string | null>(null);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      const salvo = salvarCalculo(nome, dados);
      modalRef.current?.close();
      onSalvo(salvo.id);
    } catch (falha) {
      setErro(
        falha instanceof Error && falha.message
          ? falha.message
          : "Não conseguimos salvar neste aparelho. Libere espaço no navegador e tente de novo.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => modalRef.current?.showModal()}
        className="h-14 rounded-xl bg-framboesa text-base font-semibold text-white active:bg-framboesa-escura"
      >
        Salvar cálculo
      </button>

      <dialog
        ref={modalRef}
        aria-labelledby="titulo-salvar"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-papel p-0 text-ameixa backdrop:bg-ameixa/60 sm:m-auto sm:max-w-md sm:rounded-3xl"
      >
        <form onSubmit={salvar} className="pb-seguro p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 id="titulo-salvar" className="font-titulo text-2xl leading-tight">
              Nome da festa
            </h2>
            <button
              type="button"
              onClick={() => modalRef.current?.close()}
              aria-label="Fechar"
              className="-mt-1 -mr-2 grid size-11 place-items-center rounded-full text-ameixa/60 active:bg-linha"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>
          <label htmlFor="nome-festa" className="sr-only">
            Nome da festa
          </label>
          <input
            id="nome-festa"
            autoFocus
            required
            maxLength={120}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Festa da Sofia - Safari"
            className="mt-4 h-14 w-full rounded-xl border border-linha bg-white px-4 text-base placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none"
          />
          {erro && (
            <p role="alert" className="mt-3 rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
              {erro}
            </p>
          )}
          <button
            type="submit"
            className="mt-4 flex h-14 w-full items-center justify-center rounded-xl bg-framboesa text-base font-semibold text-white active:bg-framboesa-escura"
          >
            Salvar
          </button>
        </form>
      </dialog>
    </>
  );
}
