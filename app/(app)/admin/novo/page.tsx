import { exigirAdmin } from "@/lib/admin";
import { FormModulo } from "../form-modulo";

export const metadata = { title: "Novo módulo — Kit da Decoradora" };

export default async function NovoModuloPage() {
  await exigirAdmin();
  return <FormModulo />;
}
