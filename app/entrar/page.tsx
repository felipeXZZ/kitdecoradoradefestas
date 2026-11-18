import { CanaisAjuda } from "@/components/canais-ajuda";
import { FormEntrada } from "./form-entrada";

export const metadata = { title: "Entrar — Biblioteca Visual da Decoradora de Festas" };

export default function EntrarPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header
        className="pt-seguro rounded-b-[2rem] bg-ameixa text-white"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 100% 0%, rgba(176,48,107,0.55) 0%, rgba(176,48,107,0) 60%)",
        }}
      >
        <div className="mx-auto w-full max-w-sm px-5 pt-14 pb-24">
          <span className="inline-flex h-7 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80">
            Área de membros
          </span>

          <h1 className="mt-5 font-titulo text-[2.125rem] leading-[1.08] font-bold text-balance">
            Biblioteca Visual da Decoradora de Festas
          </h1>

          <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/70">
            Seus projetos de festa, a calculadora de preço e as ferramentas do seu negócio em um
            lugar só.
          </p>
        </div>
      </header>

      <div className="mx-auto -mt-14 w-full max-w-sm flex-1 px-5 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <FormEntrada />
        <CanaisAjuda />
      </div>
    </main>
  );
}
