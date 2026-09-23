import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a service role key: ignora RLS. Só pode ser importado em rota de
 * servidor ou server action, nunca em componente "use client".
 */
export function createAdminClient() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  if (typeof window !== "undefined") throw new Error("Cliente admin usado no navegador.");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
