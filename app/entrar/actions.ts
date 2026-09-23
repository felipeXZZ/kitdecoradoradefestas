"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSAO, criarValorCookie, OPCOES_COOKIE } from "@/lib/sessao";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plano } from "@/lib/tipos";

export type EstadoEntrada =
  | { status: "inicial" }
  | { status: "sem_compra"; email: string }
  | { status: "bloqueado"; email: string }
  | { status: "erro"; email: string; mensagem: string };

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function entrar(_: EstadoEntrada, formData: FormData): Promise<EstadoEntrada> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_VALIDO.test(email)) {
    return { status: "erro", email, mensagem: "Confira o e-mail digitado." };
  }

  const { data, error } = await createAdminClient()
    .from("compras")
    .select("email, nome, plano, ativo")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[entrar]", error.message);
    return {
      status: "erro",
      email,
      mensagem: "Não conseguimos confirmar seu acesso agora. Tente de novo ou fale com o suporte.",
    };
  }

  if (!data) return { status: "sem_compra", email };
  if (!data.ativo) return { status: "bloqueado", email };

  const store = await cookies();
  store.set(
    COOKIE_SESSAO,
    await criarValorCookie({
      email: data.email,
      nome: data.nome,
      plano: (data.plano === "completo" ? "completo" : "basico") as Plano,
    }),
    OPCOES_COOKIE,
  );

  redirect("/");
}
