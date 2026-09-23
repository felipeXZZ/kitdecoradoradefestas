import { Suspense } from "react";
import { Calculadora } from "@/components/calculadora/calculadora";

export const metadata = { title: "Calculadora — Kit da Decoradora" };

export default function CalculadoraPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white" aria-hidden="true" />}>
      <Calculadora />
    </Suspense>
  );
}
