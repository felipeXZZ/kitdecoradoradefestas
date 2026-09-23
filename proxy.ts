import type { NextRequest } from "next/server";
import { protegerRotas } from "@/lib/proxy";

export async function proxy(request: NextRequest) {
  return protegerRotas(request);
}

export const config = {
  matcher: [
    // Tudo, menos arquivos estáticos, ícones e o manifesto do PWA.
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
