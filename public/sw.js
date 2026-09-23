// Service worker mínimo: permite instalar o app e abrir offline com a última
// tela visitada. Páginas: rede primeiro, cache se estiver sem internet.
// Arquivos de /_next/static e ícones: cache primeiro (têm hash no nome).

const VERSAO = "kd-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Login, sessão e APIs nunca vêm do cache.
  if (url.pathname.startsWith("/auth") || url.pathname.startsWith("/api")) return;

  if (request.mode === "navigate") {
    // Saiu da conta: apaga as telas guardadas para não mostrar dados de ninguém.
    if (url.pathname === "/login") event.waitUntil(caches.delete(VERSAO));
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          // Só guarda tela de verdade; redirecionamento para o login não.
          if (resposta.ok && !resposta.redirected) {
            const copia = resposta.clone();
            caches.open(VERSAO).then((cache) => cache.put(request, copia));
          }
          return resposta;
        })
        .catch(() =>
          caches
            .match(request)
            .then((salva) => salva || caches.match("/"))
            .then((salva) => salva || new Response("Sem conexão.", { status: 503 })),
        ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (salva) =>
          salva ||
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(VERSAO).then((cache) => cache.put(request, copia));
            }
            return resposta;
          }),
      ),
    );
  }
});
