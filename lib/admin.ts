import { notFound } from "next/navigation";
import { exigirSessao } from "@/lib/sessao";

/** E-mails de ADMIN_EMAILS (separados por vírgula). Só roda no servidor. */
export function ehAdmin(email: string | null | undefined) {
  if (!email) return false;
  const lista = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.trim().toLowerCase());
}

/** Para páginas e actions do /admin: quem não é admin vê 404, sem pista de que a rota existe. */
export async function exigirAdmin() {
  const sessao = await exigirSessao();
  if (!ehAdmin(sessao.email)) notFound();
  return sessao;
}
