import { CalculoSalvoDetalhe } from "./detalhe";

export const metadata = { title: "Cálculo salvo — Kit da Decoradora" };

export default async function CalculoSalvoPage({ params }: PageProps<"/historico/[id]">) {
  const { id } = await params;
  return <CalculoSalvoDetalhe id={id} />;
}
