import { Header } from "@/components/header";
import { BarraNavegacao } from "@/components/barra-navegacao";
import { FaixaInstalar } from "@/components/pwa";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pb-barra mx-auto max-w-5xl px-4 pt-[calc(3.5rem+env(safe-area-inset-top)+1.25rem)]">
        {children}
      </main>
      <FaixaInstalar />
      <BarraNavegacao />
    </>
  );
}
