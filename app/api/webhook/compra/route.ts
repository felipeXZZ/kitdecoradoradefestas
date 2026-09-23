import { timingSafeEqual } from "node:crypto";
import { type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plano } from "@/lib/tipos";

/**
 * Webhook de compra da GGCheckout (CLAUDE.md, seção 11).
 *
 * O payload deles traz `event` ("pix.paid"), `customer.email`, `payment.status`
 * e `product.id` + `products[]`. O segredo chega em `x-secret` ou em
 * `Authorization: Bearer`. Compra aprovada grava o e-mail em `compras`, e é
 * essa lista que a tela de entrada consulta.
 */

const TAMANHO_MAXIMO = 64 * 1024;
const STATUS_APROVADO = new Set(["paid", "approved", "aprovado", "pago", "completed"]);
const STATUS_PERDA = new Set(["refunded", "charged_back", "chargedback", "estornado"]);

type Tipo = "basico" | "completo" | "upgrade";

export async function POST(request: NextRequest) {
  const bruto = (await request.text()).slice(0, TAMANHO_MAXIMO);
  const admin = createAdminClient();

  const log = async (status: string, extra: { detalhe?: string; email?: string; produto?: string } = {}) => {
    const { error } = await admin.from("webhook_log").insert({ status, payload: bruto, ...extra });
    if (error) console.error("[webhook] log", error.message);
  };

  if (!segredoValido(request)) {
    await log("assinatura_invalida");
    return NextResponse.json({ erro: "segredo inválido" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bruto);
  } catch {
    await log("ignorado", { detalhe: "JSON inválido" });
    return NextResponse.json({ ok: true, ignorado: "json" });
  }

  const email = texto(pegar(payload, "customer.email", "data.customer.email", "buyer.email", "email"))
    ?.trim()
    .toLowerCase();
  const nome = texto(pegar(payload, "customer.name", "data.customer.name", "name"))?.trim();
  const evento = texto(pegar(payload, "event", "data.event"))?.toLowerCase();
  const status = (
    texto(pegar(payload, "payment.status", "data.payment.status", "status")) ??
    // "pix.paid" / "card.refunded": o status também vem no nome do evento.
    evento?.split(".").pop() ??
    ""
  )
    .trim()
    .toLowerCase();
  const pagamentoId = texto(pegar(payload, "payment.id", "data.payment.id", "transaction_id"));
  const produtos = idsDeProduto(payload);
  const valor = valorEmReais(pegar(payload, "payment.amount", "data.payment.amount", "amount"));
  const base = { email, produto: produtos.join(",") || undefined };

  if (!STATUS_APROVADO.has(status)) {
    // Pix pendente, recusa, estorno e chargeback: registrados e ignorados.
    const perda = STATUS_PERDA.has(status);
    await log("ignorado", { ...base, detalhe: `${perda ? "perda: " : ""}status ${status || "ausente"}` });
    return NextResponse.json({ ok: true, ignorado: "status" });
  }

  const tipo = tipoDaCompra(produtos, valor);
  if (!email || !tipo) {
    await log("ignorado", { ...base, detalhe: !email ? "sem e-mail" : "produto não mapeado" });
    return NextResponse.json({ ok: true, ignorado: !email ? "email" : "produto" });
  }

  try {
    const detalhe = await liberarAcesso(admin, { email, nome, tipo, pagamentoId });
    await log("processado", { ...base, detalhe });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    console.error("[webhook]", mensagem);
    await log("erro", { ...base, detalhe: mensagem.slice(0, 500) });
    // 500 faz o gateway tentar de novo, que é o certo quando a falha foi nossa.
    return NextResponse.json({ erro: "falha ao processar" }, { status: 500 });
  }
}

async function liberarAcesso(
  admin: SupabaseClient,
  {
    email,
    nome,
    tipo,
    pagamentoId,
  }: { email: string; nome?: string; tipo: Tipo; pagamentoId?: string },
) {
  const planoComprado: Plano = tipo === "basico" ? "basico" : "completo";

  const { data: existente, error: erroBusca } = await admin
    .from("compras")
    .select("id, plano, nome")
    .eq("email", email)
    .maybeSingle();
  if (erroBusca) throw new Error(`busca compra: ${erroBusca.message}`);

  // Nunca rebaixa: quem já tem o completo continua com ele.
  const plano: Plano =
    existente?.plano === "completo" ? "completo" : planoComprado;

  const registro = {
    email,
    nome: existente?.nome || nome || null,
    plano,
    ativo: true,
    pagamento_id: pagamentoId ?? null,
    atualizado_em: new Date().toISOString(),
  };

  const { error } = await admin.from("compras").upsert(registro, { onConflict: "email" });
  if (error) throw new Error(`grava compra: ${error.message}`);

  return `${existente ? "acesso atualizado" : "acesso liberado"}, plano ${plano} (${tipo})`;
}

/** IDs do produto principal e dos order bumps/upsells da mesma compra. */
function idsDeProduto(payload: unknown) {
  const ids = new Set<string>();
  const principal = texto(pegar(payload, "product.id", "data.product.id", "product_id"));
  if (principal) ids.add(principal);

  const lista = pegar(payload, "products", "data.products");
  if (Array.isArray(lista)) {
    for (const item of lista) {
      const id = texto(pegar(item, "id"));
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

/** Centavos ou reais: o gateway manda `amount` de um jeito nas duas. */
function valorEmReais(v: unknown) {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Acima de mil não é preço deste produto: veio em centavos.
  return n > 1000 ? n / 100 : n;
}

/**
 * Qual acesso a compra dá. Primeiro pelos IDs de produto; se o checkout usa um
 * produto só com ofertas diferentes (é o nosso caso na GGCheckout), decide pelo
 * valor pago. O produto de maior acesso ganha.
 */
function tipoDaCompra(ids: string[], valor: number | null): Tipo | null {
  const lista = (nome: string) =>
    (process.env[nome] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  if (ids.some((id) => lista("WEBHOOK_PRODUTOS_COMPLETO").includes(id))) return "completo";
  if (ids.some((id) => lista("WEBHOOK_PRODUTOS_UPGRADE").includes(id))) return "upgrade";
  if (ids.some((id) => lista("WEBHOOK_PRODUTOS_BASICO").includes(id))) return "basico";

  if (valor !== null) {
    const numero = (nome: string, padrao: number) => {
      const n = Number(process.env[nome]);
      return Number.isFinite(n) && n > 0 ? n : padrao;
    };
    // Upgrade custa menos que o completo, então é testado antes.
    const upgrade = numero("WEBHOOK_VALOR_UPGRADE", 12);
    if (Math.abs(valor - upgrade) < 0.5) return "upgrade";
    if (valor >= numero("WEBHOOK_VALOR_MIN_COMPLETO", 20)) return "completo";
    return "basico";
  }

  // Sem ID conhecido e sem valor: cai no plano padrão, se houver. Vale mais
  // liberar acesso a mais do que deixar uma compradora na mão.
  const padrao = (process.env.WEBHOOK_PRODUTO_PADRAO ?? "").trim();
  if (padrao === "basico" || padrao === "completo") return padrao;
  return null;
}

function segredoValido(request: NextRequest) {
  const segredo = process.env.WEBHOOK_SECRET ?? "";
  if (!segredo) return false;

  const candidatos = [
    request.headers.get("x-secret"),
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""),
  ];

  return candidatos.some((c) => {
    if (!c) return false;
    const recebido = Buffer.from(c.trim());
    const esperado = Buffer.from(segredo);
    return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
  });
}

function pegar(obj: unknown, ...caminhos: string[]): unknown {
  for (const caminho of caminhos) {
    let atual: unknown = obj;
    for (const parte of caminho.split(".")) {
      atual = atual && typeof atual === "object" ? (atual as Record<string, unknown>)[parte] : undefined;
    }
    if (atual !== undefined && atual !== null && atual !== "") return atual;
  }
  return undefined;
}

function texto(v: unknown) {
  return typeof v === "string" || typeof v === "number" ? String(v) : undefined;
}
