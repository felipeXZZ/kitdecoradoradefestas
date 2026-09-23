const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const data = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

/** "R$ 1.234,50" — com espaço normal, que printa e cola bem no WhatsApp. */
export function brl(valor: number) {
  return reais.format(Number.isFinite(valor) ? valor : 0).replace(/ /g, " ");
}

export function numero(valor: number) {
  return decimal.format(Number.isFinite(valor) ? valor : 0);
}

export function dataCurta(iso: string) {
  return data.format(new Date(iso)).replace(".", "");
}
