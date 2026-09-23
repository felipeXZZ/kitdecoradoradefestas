import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormModulo } from "../form-modulo";

export const metadata = { title: "Editar módulo — Kit da Decoradora" };

export default async function EditarModuloPage({ params }: PageProps<"/admin/[id]">) {
  await exigirAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await createAdminClient()
    .from("modulos")
    .select("id, titulo, descricao, capa_url, contador, url_drive, plano_minimo, ordem, ativo, em_breve")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  return <FormModulo modulo={data} />;
}
