export type Plano = "basico" | "completo";

export type Modulo = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  contador: string | null;
  url_drive: string;
  plano_minimo: Plano;
  ordem: number | null;
  /** Aparece em preto e branco com o selo "Em breve" e não abre. */
  em_breve: boolean;
};

export type TipoEvento = "abriu_modulo" | "calculou" | "viu_bloqueado";

export function moduloLiberado(modulo: Pick<Modulo, "plano_minimo">, plano: Plano) {
  return plano === "completo" || modulo.plano_minimo === "basico";
}
