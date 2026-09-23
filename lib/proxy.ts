import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerValorCookie } from "@/lib/sessao";

// Rotas que não exigem acesso: a tela de entrada, o webhook (que se autentica
// pelo próprio segredo) e a saída.
const ROTAS_PUBLICAS = ["/entrar", "/sair", "/api/webhook"];

function ehPublica(pathname: string) {
  return ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export async function protegerRotas(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessao = await lerValorCookie(request.cookies.get(COOKIE_SESSAO)?.value);

  const irPara = (destino: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (!sessao && !ehPublica(pathname)) return irPara("/entrar");
  if (sessao && pathname === "/entrar") return irPara("/");

  return NextResponse.next({ request });
}
