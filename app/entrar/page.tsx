import { CanaisAjuda } from "@/components/canais-ajuda";
import { Logo } from "@/components/logo";
import { FormEntrada } from "./form-entrada";

export const metadata = { title: "Entrar — Kit da Decoradora" };

export default function EntrarPage() {
  return (
    <main className="pt-seguro flex min-h-dvh flex-col px-5 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-10">
          <Logo tamanho="lg" />
        </div>
        <FormEntrada />
        <CanaisAjuda />
      </div>
    </main>
  );
}
