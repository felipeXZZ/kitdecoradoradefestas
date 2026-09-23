"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { CampoDinheiro, CampoNumero, CampoTexto } from "@/components/calculadora/campos";
import { brl, dataCurta } from "@/lib/formato";
import { listarCalculos, obterCalculo, type CalculoSalvo } from "@/lib/historico-local";
import type { PerfilNegocio } from "@/lib/perfil-negocio";
import { criarOrcamento, type DadosNovoOrcamento } from "../actions";

const INPUT =
  "h-12 w-full rounded-xl border border-linha bg-white px-3 text-base placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none";

const ITENS_SUGERIDOS = [
  "Painel decorado",
  "Cilindros com arranjos",
  "Arco de balões",
  "Mesa do bolo montada",
  "Bandejas e boleiras",
  "Montagem e desmontagem",
];

type Props = { perfil: PerfilNegocio; duplicar: DadosNovoOrcamento | null };

export function FormOrcamento({ perfil, duplicar }: Props) {
  const router = useRouter();
  const [passo, setPasso] = useState(duplicar ? 1 : 0);
  const [calculos, setCalculos] = useState<CalculoSalvo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  const [dados, setDados] = useState<DadosNovoOrcamento>(
    duplicar ?? {
      cliente_nome: "",
      cliente_telefone: "",
      data_festa: "",
      local_festa: "",
      projeto_id: "",
      projeto_titulo: "",
      itens: [],
      valor_total: 0,
      percentual_sinal: perfil.percentual_sinal,
      validade_dias: perfil.validade_padrao_dias,
      condicoes: perfil.condicoes_padrao ?? "",
    },
  );

  useEffect(() => setCalculos(listarCalculos()), []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [passo]);

  const mudar = (parcial: Partial<DadosNovoOrcamento>) => setDados((d) => ({ ...d, ...parcial }));

  function usarCalculo(id: string) {
    const calculo = obterCalculo(id);
    if (!calculo) return;
    mudar({ valor_total: calculo.preco_final, projeto_titulo: calculo.nome });
    setPasso(1);
  }

  function enviar() {
    setErro(null);
    iniciar(async () => {
      const resposta = await criarOrcamento(dados);
      if (!resposta.ok) return setErro(resposta.mensagem);
      router.push(`/orcamentos/${resposta.id}`);
      router.refresh();
    });
  }

  const sinal = (dados.valor_total * dados.percentual_sinal) / 100;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Passo {passo + 1} de 3</span>
          {dados.projeto_titulo && (
            <span className="truncate pl-4 text-ameixa/60">{dados.projeto_titulo}</span>
          )}
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-linha"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={passo + 1}
          aria-label="Progresso do orçamento"
        >
          <div
            className="h-full rounded-full bg-framboesa transition-all"
            style={{ width: `${((passo + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {passo === 0 && (
        <section>
          <h1 className="font-titulo text-2xl leading-tight">De onde vem o preço?</h1>
          <p className="mt-1 mb-5 text-ameixa/70">
            Use um cálculo que você já fez ou digite o valor fechado.
          </p>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-linha bg-white p-4">
              <h2 className="font-semibold">Usar um cálculo salvo</h2>
              {calculos.length === 0 ? (
                <p className="mt-1 text-sm text-ameixa/60">
                  Você ainda não tem cálculos salvos neste aparelho.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-linha">
                  {calculos.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => usarCalculo(c.id)}
                        className="flex w-full items-center gap-3 py-3 text-left active:opacity-70"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{c.nome}</p>
                          <p className="text-sm text-ameixa/60">{dataCurta(c.criado_em)}</p>
                        </div>
                        <span className="shrink-0 font-titulo text-lg tabular-nums">
                          {brl(c.preco_final)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-linha bg-white p-4">
              <h2 className="mb-3 font-semibold">Digitar o valor</h2>
              <CampoDinheiro
                rotulo="Valor total da festa"
                rotuloOculto
                valor={dados.valor_total}
                onChange={(valor_total) => mudar({ valor_total })}
              />
              <button
                type="button"
                disabled={!(dados.valor_total > 0)}
                onClick={() => setPasso(1)}
                className="mt-3 h-12 w-full rounded-xl bg-framboesa font-semibold text-white disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </div>
        </section>
      )}

      {passo === 1 && (
        <section>
          <h1 className="font-titulo text-2xl leading-tight">Dados do cliente</h1>
          <p className="mt-1 mb-5 text-ameixa/70">Só o nome é obrigatório.</p>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Nome do cliente</span>
              <input
                required
                maxLength={120}
                placeholder="Mariana Silva"
                className={INPUT}
                value={dados.cliente_nome}
                onChange={(e) => mudar({ cliente_nome: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">WhatsApp do cliente</span>
              <input
                type="tel"
                inputMode="tel"
                placeholder="(11) 99999-8888"
                className={INPUT}
                value={dados.cliente_telefone}
                onChange={(e) => mudar({ cliente_telefone: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Data da festa</span>
              <input
                type="date"
                className={INPUT}
                value={dados.data_festa}
                onChange={(e) => mudar({ data_festa: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Local</span>
              <input
                maxLength={200}
                placeholder="Salão do condomínio, Rua das Flores 120"
                className={INPUT}
                value={dados.local_festa}
                onChange={(e) => mudar({ local_festa: e.target.value })}
              />
            </label>
          </div>
        </section>
      )}

      {passo === 2 && (
        <section>
          <h1 className="font-titulo text-2xl leading-tight">O que está incluso</h1>
          <p className="mt-1 mb-5 text-ameixa/70">
            Apague o que não vai fazer e acrescente o que faltar.
          </p>

          <div className="space-y-2">
            {dados.itens.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-linha bg-white p-2">
                <div className="flex-1">
                  <CampoTexto
                    rotulo={`Item ${i + 1}`}
                    rotuloOculto
                    valor={item.descricao}
                    onChange={(descricao) =>
                      mudar({
                        itens: dados.itens.map((x, j) => (j === i ? { ...x, descricao } : x)),
                      })
                    }
                  />
                </div>
                <div className="w-16">
                  <CampoNumero
                    rotulo="Quantidade"
                    rotuloOculto
                    valor={item.quantidade}
                    onChange={(quantidade) =>
                      mudar({
                        itens: dados.itens.map((x, j) => (j === i ? { ...x, quantidade } : x)),
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remover item ${i + 1}`}
                  onClick={() => mudar({ itens: dados.itens.filter((_, j) => j !== i) })}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-ameixa/50 active:bg-linha"
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => mudar({ itens: [...dados.itens, { descricao: "", quantidade: 1 }] })}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-framboesa/50 font-semibold text-framboesa"
            >
              <Plus className="size-5" aria-hidden="true" />
              Adicionar item
            </button>
          </div>

          {dados.itens.length === 0 && (
            <div className="mt-3">
              <p className="mb-2 text-sm text-ameixa/60">Toque para incluir os mais usados:</p>
              <div className="flex flex-wrap gap-2">
                {ITENS_SUGERIDOS.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() =>
                      mudar({ itens: [...dados.itens, { descricao: sugestao, quantidade: 1 }] })
                    }
                    className="h-11 rounded-full border border-linha bg-white px-3 text-sm font-semibold"
                  >
                    + {sugestao}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 rounded-2xl border border-linha bg-white p-4">
            <CampoDinheiro
              rotulo="Valor total"
              valor={dados.valor_total}
              onChange={(valor_total) => mudar({ valor_total })}
            />
            <div className="grid grid-cols-2 gap-3">
              <CampoNumero
                rotulo="Sinal"
                sufixo="%"
                valor={dados.percentual_sinal}
                onChange={(percentual_sinal) => mudar({ percentual_sinal })}
                dica={dados.valor_total > 0 ? brl(sinal) : undefined}
              />
              <CampoNumero
                rotulo="Validade"
                sufixo="dias"
                valor={dados.validade_dias}
                onChange={(validade_dias) => mudar({ validade_dias })}
              />
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Condições</span>
              <textarea
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-linha bg-white p-3 text-base focus:border-framboesa focus:outline-none"
                value={dados.condicoes}
                onChange={(e) => mudar({ condicoes: e.target.value })}
              />
            </label>
          </div>
        </section>
      )}

      {erro && (
        <p role="alert" className="mt-4 rounded-lg bg-confete-claro px-3 py-2 text-sm font-semibold">
          {erro}
        </p>
      )}

      {passo > 0 && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 mt-6 border-t border-linha bg-papel/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-xl gap-2">
            <button
              type="button"
              onClick={() => setPasso(passo - 1)}
              aria-label="Voltar"
              className="grid size-14 shrink-0 place-items-center rounded-xl border border-linha bg-white"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            {passo === 1 ? (
              <button
                type="button"
                disabled={!dados.cliente_nome.trim()}
                onClick={() => setPasso(2)}
                className="h-14 flex-1 rounded-xl bg-framboesa text-base font-semibold text-white disabled:opacity-40"
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                disabled={enviando}
                onClick={enviar}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-framboesa text-base font-semibold text-white disabled:opacity-70"
              >
                {enviando ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="size-5" aria-hidden="true" />
                )}
                Gerar orçamento
              </button>
            )}
          </div>
        </div>
      )}

      {passo === 0 && dados.valor_total > 0 && (
        <button
          type="button"
          onClick={() => setPasso(1)}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-linha bg-white font-semibold"
        >
          <Pencil className="size-4" aria-hidden="true" />
          Continuar com {brl(dados.valor_total)}
        </button>
      )}
    </div>
  );
}
