import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EditorConteudo, type ModeloAdmin, type ScriptAdmin } from "./editor";

export const metadata = { title: "Conteúdo — Kit da Decoradora" };

export default async function ConteudoPage() {
  await exigirAdmin();
  const admin = createAdminClient();

  const [scripts, modelos] = await Promise.all([
    admin.from("scripts").select("id, categoria, titulo, corpo, ordem, ativo").order("categoria").order("ordem"),
    admin.from("documentos_modelo").select("tipo, titulo, descricao, corpo, ativo"),
  ]);

  if (scripts.error) console.error("[admin] scripts", scripts.error.message);
  if (modelos.error) console.error("[admin] modelos", modelos.error.message);

  return (
    <div>
      <Link
        href="/admin"
        className="-ml-2 mb-2 inline-flex h-11 items-center gap-1 pr-3 text-sm font-semibold text-ameixa/70"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        Admin
      </Link>
      <EditorConteudo
        scripts={(scripts.data ?? []) as ScriptAdmin[]}
        modelos={(modelos.data ?? []) as ModeloAdmin[]}
      />
    </div>
  );
}
