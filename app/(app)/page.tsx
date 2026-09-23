import { BannerNovidade } from "@/components/acervo/banner-novidade";
import { ListaModulos } from "@/components/acervo/lista-modulos";
import { exigirSessao, primeiroNome } from "@/lib/sessao";
import { createClient } from "@/lib/supabase/server";
import type { Modulo } from "@/lib/tipos";

export default async function AcervoPage() {
  const sessao = await exigirSessao();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modulos")
    .select("id, titulo, descricao, capa_url, contador, url_drive, plano_minimo, ordem, em_breve")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) console.error("[acervo] modulos", error.message);
  const modulos = (data ?? []) as Modulo[];

  return (
    <div className="space-y-6">
      <section>
        {/* Saudação neutra: o kit também é comprado por homens. */}
        <h1 className="font-titulo text-2xl leading-tight">Olá, {primeiroNome(sessao)}!</h1>
        <p className="mt-1 text-ameixa/70">Seu acervo completo de projetos de festa, pronto pra usar.</p>
      </section>

      <BannerNovidade />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Módulos liberados</h2>
        <ListaModulos modulos={modulos} plano={sessao.plano} />
      </section>
    </div>
  );
}
