import Link from "next/link";
import { ChevronRight, ImageOff, Plus } from "lucide-react";
import { exigirAdmin } from "@/lib/admin";
import { urlImagem } from "@/lib/imagem";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Admin — Kit da Decoradora" };

type Linha = {
  id: string;
  titulo: string;
  capa_url: string | null;
  contador: string | null;
  plano_minimo: string;
  ordem: number | null;
  ativo: boolean;
  em_breve: boolean;
};

export default async function AdminPage() {
  await exigirAdmin();

  // Service role: o admin precisa ver também os módulos inativos (RLS só mostra ativos).
  const { data, error } = await createAdminClient()
    .from("modulos")
    .select("id, titulo, capa_url, contador, plano_minimo, ordem, ativo, em_breve")
    .order("ordem", { ascending: true });
  if (error) console.error("[admin] listar", error.message);
  const modulos = (data ?? []) as Linha[];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="font-titulo text-2xl">Módulos</h1>
        <Link
          href="/admin/novo"
          className="flex h-11 items-center gap-1.5 rounded-xl bg-framboesa px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-5" aria-hidden="true" />
          Novo módulo
        </Link>
      </div>

      {modulos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linha bg-white px-5 py-10 text-center text-ameixa/70">
          Nenhum módulo cadastrado.
        </p>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha bg-white">
          {modulos.map((m) => {
            const capa = urlImagem(m.capa_url, 160);
            return (
              <li key={m.id}>
                <Link href={`/admin/${m.id}`} className="flex items-center gap-3 px-3 py-2.5 active:bg-papel">
                  <div className="grid aspect-video w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-linha/60">
                    {capa ? (
                      <img src={capa} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <ImageOff className="size-5 text-ameixa/30" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-semibold ${m.ativo ? "" : "text-ameixa/40 line-through"}`}>
                      {m.titulo}
                    </p>
                    <p className="text-sm text-ameixa/60">
                      #{m.ordem ?? 0} · {m.plano_minimo === "completo" ? "Kit Completo" : "Básico"}
                      {m.contador ? ` · ${m.contador}` : ""}
                      {m.em_breve ? " · em breve" : ""}
                      {m.ativo ? "" : " · inativo"}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-ameixa/40" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
