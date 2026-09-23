/**
 * Aplica supabase/conteudo-ferramentas.json no banco (scripts de WhatsApp e
 * modelos de documento). Pode rodar quantas vezes quiser.
 *
 *   node scripts/semear.cjs
 *
 * Usa a service role key do .env.local: rode só na sua máquina.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const raiz = path.join(__dirname, "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(raiz, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const conteudo = JSON.parse(
  fs.readFileSync(path.join(raiz, "supabase", "conteudo-ferramentas.json"), "utf8"),
);

(async () => {
  const existentes = await db.from("scripts").select("id, categoria, titulo");
  if (existentes.error) throw new Error(existentes.error.message);

  for (const script of conteudo.scripts) {
    const antigo = (existentes.data ?? []).find(
      (e) => e.categoria === script.categoria && e.titulo === script.titulo,
    );
    const r = antigo
      ? await db.from("scripts").update(script).eq("id", antigo.id)
      : await db.from("scripts").insert(script);
    console.log(`${antigo ? "atualizado" : "inserido"}: ${script.categoria}`, r.error?.message ?? "");
  }

  const r = await db.from("documentos_modelo").upsert(conteudo.modelos, { onConflict: "tipo" });
  console.log("modelos:", r.error ? r.error.message : conteudo.modelos.map((m) => m.tipo).join(", "));
})();
