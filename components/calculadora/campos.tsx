"use client";

import { useEffect, useId, useState } from "react";
import { brl } from "@/lib/formato";

const CLASSE_INPUT =
  "h-12 w-full rounded-xl border border-linha bg-white px-3 text-base tabular-nums placeholder:text-ameixa/35 focus:border-framboesa focus:outline-none";

type Base = {
  rotulo: string;
  valor: number;
  onChange: (valor: number) => void;
  dica?: string;
  rotuloOculto?: boolean;
};

function Rotulo({ id, rotulo, oculto }: { id: string; rotulo: string; oculto?: boolean }) {
  return (
    <label htmlFor={id} className={oculto ? "sr-only" : "mb-1 block text-sm font-semibold"}>
      {rotulo}
    </label>
  );
}

/**
 * Dinheiro com máscara em reais: os dígitos entram pela direita como centavos
 * (digitar 1250 vira R$ 12,50). Não tem vírgula para errar com uma mão só.
 */
export function CampoDinheiro({ rotulo, valor, onChange, dica, rotuloOculto }: Base) {
  const id = useId();
  return (
    <div>
      <Rotulo id={id} rotulo={rotulo} oculto={rotuloOculto} />
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="R$ 0,00"
        value={valor > 0 ? brl(valor) : ""}
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, "").slice(-11);
          onChange(Number(digitos || 0) / 100);
        }}
        onFocus={(e) => e.currentTarget.select()}
        className={CLASSE_INPUT}
      />
      {dica && <p className="mt-1.5 text-sm text-ameixa/60">{dica}</p>}
    </div>
  );
}

const paraTexto = (v: number) => (v ? String(v).replace(".", ",") : "");
const paraNumero = (t: string) => {
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Número decimal com vírgula (horas, km, %, quantidade). */
export function CampoNumero({
  rotulo,
  valor,
  onChange,
  dica,
  rotuloOculto,
  sufixo,
}: Base & { sufixo?: string }) {
  const id = useId();
  const [texto, setTexto] = useState(paraTexto(valor));

  // Valor trocado de fora (novo cálculo, duplicar): reflete no campo.
  useEffect(() => {
    if (paraNumero(texto) !== valor) setTexto(paraTexto(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  return (
    <div>
      <Rotulo id={id} rotulo={rotulo} oculto={rotuloOculto} />
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={texto}
          onChange={(e) => {
            // Aceita ponto ou vírgula e mantém uma vírgula só.
            const [inteiro, ...resto] = e.target.value.replace(/[^\d,.]/g, "").replace(/\./g, ",").split(",");
            const limpo = resto.length ? `${inteiro},${resto.join("")}` : inteiro;
            setTexto(limpo);
            onChange(paraNumero(limpo));
          }}
          onFocus={(e) => e.currentTarget.select()}
          className={`${CLASSE_INPUT} ${sufixo ? "pr-10" : ""}`}
        />
        {sufixo && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ameixa/50">
            {sufixo}
          </span>
        )}
      </div>
      {dica && <p className="mt-1.5 text-sm text-ameixa/60">{dica}</p>}
    </div>
  );
}

export function CampoTexto({
  rotulo,
  valor,
  onChange,
  placeholder,
  rotuloOculto,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rotuloOculto?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <Rotulo id={id} rotulo={rotulo} oculto={rotuloOculto} />
      <input
        id={id}
        type="text"
        autoComplete="off"
        maxLength={120}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={CLASSE_INPUT}
      />
    </div>
  );
}
