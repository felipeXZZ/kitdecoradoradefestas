// Fórmula da calculadora (CLAUDE.md, seção 8). Roda igual no cliente e no
// servidor: o servidor recalcula antes de salvar, nunca confia no total enviado.

export type ItemMaterial = { nome: string; quantidade: number; custo: number };
export type ItemReutilizavel = { nome: string; valor: number; usos: number };

export type Negocio = {
  custoFixo: number;
  festasMes: number;
  margem: number;
  taxaMaquininha: number;
  imposto: number;
};

export type Dados = {
  materiais: ItemMaterial[];
  reutilizaveis: ItemReutilizavel[];
  tempo: { planejamento: number; montagem: number; desmontagem: number; valorHora: number };
  festa: { ajudante: number; km: number; custoKm: number; pedagio: number; estacionamento: number };
  negocio: Negocio;
};

export type Resultado = {
  materiais: number;
  reutilizavel: number;
  horasTotais: number;
  maoDeObra: number;
  ajudante: number;
  deslocamento: number;
  rateioFixo: number;
  custoDireto: number;
  precoBase: number;
  taxas: number;
  valorTaxas: number;
  precoFinal: number;
  lucro: number;
  margemReal: number;
  sinal: number;
  saldo: number;
};

export const NEGOCIO_VAZIO: Negocio = {
  custoFixo: 0,
  festasMes: 0,
  margem: 30,
  taxaMaquininha: 0,
  imposto: 0,
};

export function dadosVazios(negocio: Negocio = NEGOCIO_VAZIO): Dados {
  return {
    materiais: [{ nome: "", quantidade: 1, custo: 0 }],
    reutilizaveis: [{ nome: "", valor: 0, usos: 10 }],
    tempo: { planejamento: 0, montagem: 0, desmontagem: 0, valorHora: 0 },
    festa: { ajudante: 0, km: 0, custoKm: 0, pedagio: 0, estacionamento: 0 },
    negocio: { ...negocio },
  };
}

const soma = (valores: number[]) => valores.reduce((a, b) => a + b, 0);

export function somaMateriais(itens: ItemMaterial[]) {
  return soma(itens.map((i) => i.quantidade * i.custo));
}

/** Rateado por uso, nunca lançado inteiro. Item sem usos informados não entra. */
export function somaReutilizavel(itens: ItemReutilizavel[]) {
  return soma(itens.map((i) => (i.usos > 0 ? i.valor / i.usos : 0)));
}

export function somaHoras(tempo: Dados["tempo"]) {
  return tempo.planejamento + tempo.montagem + tempo.desmontagem;
}

export type Calculo = { ok: true; resultado: Resultado } | { ok: false; erro: string };

export function calcular(d: Dados): Calculo {
  const taxas = (d.negocio.taxaMaquininha + d.negocio.imposto) / 100;
  if (taxas >= 1) return { ok: false, erro: "Revise as taxas: a soma passou de 100%." };

  const materiais = somaMateriais(d.materiais);
  const reutilizavel = somaReutilizavel(d.reutilizaveis);
  const horasTotais = somaHoras(d.tempo);
  const maoDeObra = horasTotais * d.tempo.valorHora;
  const ajudante = d.festa.ajudante;
  const deslocamento = d.festa.km * d.festa.custoKm + d.festa.pedagio + d.festa.estacionamento;
  const rateioFixo = d.negocio.festasMes > 0 ? d.negocio.custoFixo / d.negocio.festasMes : 0;

  const custoDireto = materiais + reutilizavel + maoDeObra + ajudante + deslocamento + rateioFixo;
  const precoBase = custoDireto * (1 + d.negocio.margem / 100);
  // Taxa se divide, nunca se multiplica: senão a decoradora paga a maquininha.
  const precoFinal = precoBase / (1 - taxas);
  const valorTaxas = precoFinal * taxas;
  const lucro = precoFinal - custoDireto - valorTaxas;
  const margemReal = precoFinal > 0 ? (lucro / precoFinal) * 100 : 0;
  const sinal = precoFinal * 0.5;

  return {
    ok: true,
    resultado: {
      materiais,
      reutilizavel,
      horasTotais,
      maoDeObra,
      ajudante,
      deslocamento,
      rateioFixo,
      custoDireto,
      precoBase,
      taxas,
      valorTaxas,
      precoFinal,
      lucro,
      margemReal,
      sinal,
      saldo: precoFinal - sinal,
    },
  };
}

// ---------------------------------------------------------------------------
// `dados` vem de jsonb e o formulário vai mudar: normaliza qualquer versão
// antiga ou incompleta para o formato atual, sem quebrar.

const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const txt = (v: unknown) => (typeof v === "string" ? v.slice(0, 120) : "");
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const lista = (v: unknown) => (Array.isArray(v) ? v.slice(0, 200).map(obj) : []);

export function normalizarNegocio(v: unknown): Negocio {
  const n = obj(v);
  return {
    custoFixo: num(n.custoFixo),
    festasMes: num(n.festasMes),
    margem: n.margem === undefined ? NEGOCIO_VAZIO.margem : num(n.margem),
    taxaMaquininha: num(n.taxaMaquininha),
    imposto: num(n.imposto),
  };
}

export function normalizarDados(v: unknown): Dados {
  const d = obj(v);
  const t = obj(d.tempo);
  const f = obj(d.festa);
  return {
    materiais: lista(d.materiais).map((i) => ({
      nome: txt(i.nome),
      quantidade: num(i.quantidade),
      custo: num(i.custo),
    })),
    reutilizaveis: lista(d.reutilizaveis).map((i) => ({
      nome: txt(i.nome),
      valor: num(i.valor),
      usos: num(i.usos),
    })),
    tempo: {
      planejamento: num(t.planejamento),
      montagem: num(t.montagem),
      desmontagem: num(t.desmontagem),
      valorHora: num(t.valorHora),
    },
    festa: {
      ajudante: num(f.ajudante),
      km: num(f.km),
      custoKm: num(f.custoKm),
      pedagio: num(f.pedagio),
      estacionamento: num(f.estacionamento),
    },
    negocio: normalizarNegocio(d.negocio),
  };
}

/** Arredonda para centavos antes de gravar em `numeric`. */
export const centavos = (v: number) => Math.round(v * 100) / 100;
