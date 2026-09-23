import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO } from "@/lib/sessao";

export async function POST(request: NextRequest) {
  const resposta = NextResponse.redirect(new URL("/entrar", request.nextUrl.origin), { status: 303 });
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}
