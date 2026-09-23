"use client";

import { calcular, centavos, normalizarDados, type Dados } from "@/lib/calculo";

/**
 * Histórico guardado no próprio aparelho. Sem login não existe conta para
 * pendurar os cálculos, então eles vivem no localStorage do navegador dela.
 * Se ela trocar de celular ou limpar o navegador, o histórico vai com ele.
 */

const CHAVE = "kd:calculos";
const LIMITE = 200;

export type CalculoSalvo = {
  id: string;
  nome: string;
  criado_em: string;
  dados: Dados;
  preco_final: number;
  custo_direto: number;
  lucro: number;
};

function ler(): CalculoSalvo[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return [];
    return lista
      .filter((c) => c && typeof c.id === "string")
      .map((c) => ({
        id: c.id,
        nome: typeof c.nome === "string" ? c.nome : "Sem nome",
        criado_em: typeof c.criado_em === "string" ? c.criado_em : new Date().toISOString(),
        dados: normalizarDados(c.dados),
        preco_final: Number(c.preco_final) || 0,
        custo_direto: Number(c.custo_direto) || 0,
        lucro: Number(c.lucro) || 0,
      }));
  } catch {
    return [];
  }
}

function gravar(lista: CalculoSalvo[]) {
  localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, LIMITE)));
}

/** Mais recente primeiro. */
export function listarCalculos() {
  return ler().sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}

export function obterCalculo(id: string) {
  return ler().find((c) => c.id === id) ?? null;
}

export function excluirCalculo(id: string) {
  gravar(ler().filter((c) => c.id !== id));
}

export function salvarCalculo(nome: string, dados: Dados): CalculoSalvo {
  const calculo = calcular(dados);
  if (!calculo.ok) throw new Error(calculo.erro);
  const r = calculo.resultado;

  const novo: CalculoSalvo = {
    id: crypto.randomUUID(),
    nome: nome.trim().slice(0, 120) || "Sem nome",
    criado_em: new Date().toISOString(),
    dados,
    preco_final: centavos(r.precoFinal),
    custo_direto: centavos(r.custoDireto),
    lucro: centavos(r.lucro),
  };

  gravar([novo, ...ler()]);
  return novo;
}
