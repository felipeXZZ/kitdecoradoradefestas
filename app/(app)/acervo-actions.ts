"use server";

import { getSessao } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TipoEvento } from "@/lib/tipos";

/**
 * Registra uso (abriu módulo, viu bloqueado, calculou). Nunca atrapalha a
 * navegação: se falhar, a cliente não pode ficar sem o módulo por causa disso.
 */
export async function registrarEvento(tipo: TipoEvento, ref: string) {
  try {
    const sessao = await getSessao();
    if (!sessao) return;
    const { error } = await createAdminClient()
      .from("eventos_uso")
      .insert({ email: sessao.email, tipo, ref: ref.slice(0, 120) });
    if (error) console.warn("[eventos]", error.message);
  } catch (e) {
    console.warn("[eventos]", e instanceof Error ? e.message : e);
  }
}
