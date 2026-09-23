import { FerramentaBloqueada } from "@/components/ferramenta-bloqueada";
import { getPerfilNegocio } from "@/lib/perfil-negocio";
import { sessaoComPlano } from "@/lib/plano";
import { createAdminClient } from "@/lib/supabase/admin";
import { ListaScripts, type Script } from "./lista-scripts";

export const metadata = { title: "Scripts — Kit da Decoradora" };

export default async function ScriptsPage() {
  const { sessao, liberado } = await sessaoComPlano();
  if (!liberado) {
    return (
      <FerramentaBloqueada
        titulo="Scripts de WhatsApp"
        texto="O que responder no primeiro contato, no “tá caro”, na hora de cobrar o sinal e no follow-up."
      />
    );
  }

  const [{ data, error }, perfil] = await Promise.all([
    createAdminClient()
      .from("scripts")
      .select("id, categoria, titulo, corpo")
      .eq("ativo", true)
      .order("categoria")
      .order("ordem"),
    getPerfilNegocio(sessao.email),
  ]);

  if (error) console.error("[scripts]", error.message);

  return (
    <ListaScripts
      scripts={(data ?? []) as Script[]}
      nomeNegocio={perfil.nome_negocio ?? "meu ateliê"}
    />
  );
}
