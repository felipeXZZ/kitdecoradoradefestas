# Kit da Decoradora — especificação do projeto

Área de membros em formato de aplicativo (PWA) para decoradoras de festa.
Este arquivo é a fonte da verdade do projeto. Consulte-o antes de qualquer
implementação e mantenha-o atualizado quando algo mudar.

Todo o texto de interface é em português do Brasil.

---

## 1. O que é o produto

A cliente compra um kit de projetos de festa por pagamento único e recebe acesso
a este aplicativo. Dentro dele ela:

- acessa os módulos de projetos (cada módulo abre uma pasta no Google Drive);
- calcula quanto cobrar por uma festa, com margem e taxas já embutidas;
- guarda o histórico dos cálculos para reaproveitar e comparar.

Existem dois planos de acesso vitalício, sem recorrência nesta versão:

- `basico` — R$ 17,90 — módulos de festa infantil
- `completo` — R$ 29,90 — todos os módulos, todas as ocasiões
  (oferecido por R$ 22,90 no pop-up de saída da página de vendas)

Quem tem `basico` vê os módulos bloqueados com cadeado e pode liberar por R$ 12.

**A cliente usa isso em pé, dentro de uma loja de material, com uma mão.**
Essa frase decide todo empate de layout.

---

## 2. Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase — Postgres com RLS e Storage (Auth não é usado no MVP; ver seção 5)
- Deploy na Vercel
- PWA instalável na tela inicial (sem loja de aplicativo)

### Regras fixas

- Mobile-first sempre. Desenhe para 390px de largura e depois adapte para
  desktop, nunca o contrário.
- Alvos de toque com no mínimo 44px de altura.
- RLS ativado em toda tabela nova, sem exceção.
- Nenhuma biblioteca de UI pesada (nada de MUI, Chakra, Ant, shadcn).
  Tailwind puro e componentes próprios.
- Ícones: `lucide-react`.
- Imagens servidas pelo transform do Supabase Storage, nunca em tamanho cheio.
- Nenhum valor de dinheiro em `float` no banco: use `numeric`.
- Nenhuma chave secreta no cliente. `SUPABASE_SERVICE_ROLE_KEY` só em rota de
  servidor.

---

## 3. Direção visual

O produto é uma ferramenta de trabalho de uma mulher que vende festa, não uma
página de festa infantil. Deve parecer festivo e caprichado, mas sério o
bastante para ela abrir na frente de um cliente. Nada de pastel de quarto de
bebê, nada de balão como elemento decorativo.

### Cores

| Token | Hex | Uso |
|---|---|---|
| `ameixa` | `#2B1B2E` | texto principal, header, rodapé |
| `framboesa` | `#B0306B` | botões primários, aba ativa, links |
| `confete` | `#F2A93B` | badges, banner de novidade, cadeado |
| `menta` | `#1F7A5A` | lucro, margem, resultado positivo |
| `papel` | `#FCF7F8` | fundo da aplicação |
| `linha` | `#E9DCE1` | bordas e divisórias |

### Tipografia

- Títulos e números grandes: **Bricolage Grotesque** (Google Fonts), peso 700.
- Interface e corpo: **Inter**, pesos 400 e 600.
- Sem caixa alta em rótulos. Sem palavra solta colorida dentro de título.

### Princípio

A ousadia do projeto fica em **um lugar só**: o resultado da calculadora. O preço
final aparece em Bricolage, tamanho muito grande, em framboesa, ocupando a tela.
É o momento que a cliente vai printar e mandar no WhatsApp. Todo o resto do
aplicativo é quieto e disciplinado.

---

## 4. Banco de dados

Gere `supabase/schema.sql` com exatamente este conteúdo. Ele é aplicado uma vez
no SQL Editor do Supabase.

```sql
-- PERFIS
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  nome text,
  plano text not null default 'basico',          -- basico | completo
  primeiro_acesso_em timestamptz default now()
);

-- MÓDULOS DE CONTEÚDO
create table modulos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  capa_url text,
  contador text,                                  -- ex: "48 projetos"
  url_drive text not null,
  plano_minimo text not null default 'basico',    -- basico | completo
  ordem int default 0,
  ativo boolean default true
);

-- CÁLCULOS SALVOS
create table calculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nome text not null,                             -- "Festa da Sofia - Safari"
  dados jsonb not null,                           -- todos os inputs
  preco_final numeric not null,
  custo_direto numeric not null,
  lucro numeric not null,
  criado_em timestamptz default now()
);

-- EVENTOS DE USO
create table eventos (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  tipo text not null,                             -- abriu_modulo | calculou | viu_bloqueado
  ref text,
  criado_em timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table calculos enable row level security;
alter table eventos  enable row level security;
alter table modulos  enable row level security;

create policy "own profile"  on profiles for all    using (auth.uid() = id);
create policy "own calculos" on calculos for all    using (auth.uid() = user_id);
create policy "own eventos"  on eventos  for insert with check (auth.uid() = user_id);
create policy "ler modulos"  on modulos  for select using (ativo);

-- PERFIL AUTOMÁTICO AO CRIAR USUÁRIO
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ÍNDICES
create index calculos_user_idx on calculos (user_id, criado_em desc);
create index eventos_user_idx  on eventos  (user_id, criado_em desc);
create index modulos_ordem_idx on modulos  (ordem) where ativo;
```

`dados` é `jsonb` de propósito: o formulário da calculadora vai mudar várias
vezes nas primeiras semanas e não deve exigir migração de schema.

---

## 5. Acesso (MVP sem login)

Não há login, senha nem link por e-mail. A cliente digita o e-mail que usou na
compra e entra na hora.

- A tela `/entrar` confere o e-mail na tabela `compras`, alimentada pelo webhook
  da GGCheckout. E-mail fora da lista mostra "Não encontramos esse e-mail. Use o
  mesmo e-mail da compra ou fale com o suporte." com o botão de WhatsApp ao lado.
  `compras.ativo = false` mostra "Esse acesso está suspenso".
- Acesso confirmado grava o cookie `kd_acesso` (httpOnly, 180 dias) com e-mail,
  nome e plano, assinado em HMAC-SHA256 com `SESSAO_SECRET`. Sem o segredo não
  se forja um cookie. Toda a lógica está em `lib/sessao.ts`.
- `proxy.ts` (o middleware do Next 16) valida o cookie e manda para `/entrar` quem
  não tem acesso. Rotas públicas: `/entrar`, `/sair` e `/api/webhook`.
- `POST /sair` apaga o cookie.

Abaixo do formulário fica o bloco "Com dificuldade para entrar?", com WhatsApp
(`NEXT_PUBLIC_WHATSAPP_NUMERO`) e Instagram (`NEXT_PUBLIC_INSTAGRAM_URL`).
Ninguém pode travar na porta sem ter com quem falar.

O limite conhecido: quem souber o e-mail de uma compradora entra. Aceito nesta
versão para lançar rápido. O caminho de volta para acesso individual de verdade
é magic link do Supabase Auth, que exige SMTP próprio configurado.

Nada do Supabase Auth está em uso. As tabelas `profiles`, `calculos` e `eventos`
do schema original ficaram sem uso, no lugar delas entraram `compras` e
`eventos_uso` (em `supabase/04-mvp-sem-login.sql`).

---

## 6. Layout

**Header fixo no topo:** nome "Kit da Decoradora" à esquerda; à direita, ícone do
WhatsApp (link `wa.me`, número em variável de ambiente) e botão "Sair".

**Barra de navegação fixa no rodapé**, quatro abas com ícone e rótulo:

```
  Acervo        Calculadora      Histórico        Conta
     /          /calculadora     /historico       /conta
```

A aba ativa fica em framboesa. O conteúdo tem `padding-bottom` suficiente para
não ficar escondido atrás da barra.

---

## 7. Fase 1 — Acervo

Rota `/`. É a tela inicial do aplicativo.

1. **Saudação compacta** — "Bem-vinda, {primeiro nome}!" e abaixo "Seu acervo
   completo de projetos de festa, pronto pra usar." O primeiro nome vem de
   `profiles.nome`; se estiver vazio, use a parte do e-mail antes do `@`.

2. **Banner de novidade** — faixa horizontal em confete claro, com o texto vindo
   de variável de ambiente e um botão "Ver novidades" que abre um link também
   configurável. Se a variável estiver vazia, o banner não aparece.

3. **Módulos** — título "Módulos liberados" e, abaixo, os cards vindos de
   `modulos` ordenados por `ordem`:

   - 1 coluna no mobile, 2 no tablet, 3 no desktop;
   - cada card: capa em proporção 16:9, badge do `contador` sobre a imagem,
     título e descrição em uma linha;
   - **liberado** (plano `completo` vê tudo; plano `basico` vê apenas
     `plano_minimo = 'basico'`): abre `url_drive` em nova aba e grava evento
     `{tipo: 'abriu_modulo', ref: id}`;
   - **bloqueado**: capa esmaecida, cadeado em confete sobreposto e o texto
     "Disponível no Kit Completo". Ao tocar, grava evento
     `{tipo: 'viu_bloqueado', ref: id}` e abre um modal listando todos os módulos
     bloqueados, com o botão "Liberar tudo por R$ 12" apontando para a URL de
     checkout em variável de ambiente.

Módulo bloqueado **nunca some da tela**. Ver o que ela ainda não tem é o que
vende o upgrade.

**Em breve** (coluna `modulos.em_breve`, em `supabase/03-em-breve.sql`): capa em
preto e branco, selo "Em breve" em ameixa, não abre nada e não entra no modal de
upgrade. Vale para qualquer plano. A URL do Drive pode ficar vazia enquanto isso.

---

## 8. Fase 2 — Calculadora

Rota `/calculadora`. É o coração do produto.

Formulário em passos, um bloco por vez, com barra de progresso no topo. Todos os
campos de dinheiro com máscara em reais e teclado numérico
(`inputMode="decimal"`).

### Passo 1 — Materiais de consumo

Lista dinâmica com "+ Adicionar item". Cada linha: nome, quantidade, custo
unitário. Total parcial visível no rodapé do passo.

### Passo 2 — Material reutilizável

Lista dinâmica. Cada linha: nome, valor do item, número de usos previstos.
Entra no custo como `valor / usos`.

Texto de apoio abaixo do campo: "Um painel de R$ 400 que você usa em 10 festas
custa R$ 40 nesta festa. É assim que ele tem que entrar na conta."

### Passo 3 — Seu tempo

Horas de planejamento e compras, horas de montagem, horas de desmontagem, valor
da sua hora. Mostre a soma das horas em tempo real.

### Passo 4 — Custos da festa

Diária do ajudante, quilômetros de ida e volta, custo por quilômetro, pedágio,
estacionamento.

### Passo 5 — Seu negócio

Custo fixo mensal (aluguel, internet, telefone, energia), festas por mês,
margem de lucro desejada em %, taxa da maquininha em %, imposto em %.

Estes cinco campos ficam salvos como padrão da usuária em `localStorage` e vêm
preenchidos no próximo cálculo.

### Fórmula

```
materiais        = Σ (quantidade × custo_unitario)
reutilizavel     = Σ (valor_item / usos_previstos)
horas_totais     = horas_planejamento + horas_montagem + horas_desmontagem
mao_de_obra      = horas_totais × valor_hora
deslocamento     = (km_ida_volta × custo_por_km) + pedagio + estacionamento
rateio_fixo      = custo_fixo_mensal / festas_por_mes

custo_direto     = materiais + reutilizavel + mao_de_obra + ajudante
                 + deslocamento + rateio_fixo

preco_base       = custo_direto × (1 + margem/100)
taxas            = (taxa_maquininha + imposto) / 100
preco_final      = preco_base / (1 - taxas)

lucro            = preco_final − custo_direto − (preco_final × taxas)
margem_real      = lucro / preco_final × 100
sinal_sugerido   = preco_final × 0.5
saldo            = preco_final − sinal_sugerido
```

**Dois pontos que não podem ser implementados de outro jeito**, porque são o
motivo de a calculadora existir:

- material reutilizável é **rateado por uso**, nunca lançado inteiro;
- taxa se **divide** (`/ (1 - taxas)`), nunca se multiplica. Multiplicar por
  `1 + taxa` deixa a decoradora pagando a maquininha do próprio bolso em toda
  venda.

Se `taxas >= 1`, não calcule: mostre "Revise as taxas: a soma passou de 100%."

### Tela de resultado

Ocupa a tela inteira, fundo papel:

- **Preço final** em Bricolage, muito grande, em framboesa, no topo.
- Logo abaixo, em menta: "Lucro de R$ X — margem de Y%".
- Depois, em corpo normal: custo total, sinal sugerido de 50% e saldo na entrega.
- Lista recolhível "Ver a conta completa" com cada componente do custo em uma
  linha.
- Botões: **"Salvar cálculo"** (pede o nome da festa em um modal e grava em
  `calculos` + evento `{tipo: 'calculou'}`) e **"Novo cálculo"**.

Se `lucro <= 0`, troque o destaque: o preço final aparece em ameixa e acima dele
surge uma faixa em confete com "Nesse preço você não tem lucro. Aumente a margem
ou revise os custos."

---

## 9. Fase 3 — Histórico

Rota `/historico`. Lista dos cálculos salvos, mais recente primeiro.

**Sem login, o histórico fica no aparelho** (`localStorage`, chave `kd:calculos`,
em `lib/historico-local.ts`). Trocar de celular ou limpar o navegador apaga o
histórico; a tela avisa "Seus cálculos ficam salvos neste aparelho". Quando
houver login de verdade, isso volta para a tabela `calculos`.

Cada linha: nome da festa, data, preço final em destaque e lucro em menta.

Ao tocar, abre a mesma tela de resultado da calculadora, em modo leitura, com
dois botões:

- **"Duplicar"** — carrega todos os campos na calculadora para editar e salvar
  como novo cálculo. É o que mais economiza tempo dela: a próxima festa quase
  sempre é parecida com a anterior.
- **"Excluir"** — com confirmação.

Estado vazio: "Nenhum cálculo salvo ainda. Faça seu primeiro orçamento e ele
aparece aqui." com botão "Abrir calculadora".

---

## 10. Fase 4 — Conta e PWA

Rota `/conta`: e-mail, plano atual escrito por extenso ("Kit Completo — acesso
vitalício"), botão "Falar com o suporte" no WhatsApp e botão "Sair". Se o plano
for `basico`, mostre também o card de upgrade por R$ 12.

PWA: `manifest.json` com nome "Kit da Decoradora", nome curto "Decoradora",
ícones 192 e 512, `display: standalone`, `theme_color: #B0306B`,
`background_color: #FCF7F8`. Service worker simples, só o necessário para a
instalação e para o aplicativo abrir offline mostrando a última tela em cache.

Na primeira visita pelo navegador, mostre uma faixa discreta no rodapé:
"Instale na tela inicial e use como aplicativo" com botão "Instalar" (usa o
evento `beforeinstallprompt` no Android e abre instruções no iOS).

---

## 11. Fase 5 — Webhook de compra

Rota `POST /api/webhook/compra`, executada no servidor com a service role key.

1. Valide a assinatura do gateway com o segredo em variável de ambiente.
   Requisição sem assinatura válida responde 401 e não faz nada.
2. Na compra aprovada: grave o e-mail em `compras` com o `plano` do produto.
3. Se o e-mail já existe e o produto é o upgrade, apenas atualize `plano` para
   `completo`.
4. Responda 200 sempre que o evento for processado ou ignorado de propósito, para
   o gateway não reenviar em loop.
5. Registre toda requisição recebida em uma tabela `webhook_log` (payload cru,
   status, data). Isso é a sua defesa em contestação de compra.

Notas de implementação:

- Gateway: **GGCheckout**. O segredo chega em `x-secret` ou em
  `Authorization: Bearer` e é comparado com `WEBHOOK_SECRET`. Compra aprovada =
  `payment.status` (ou o final de `event`, como em `pix.paid`) igual a `paid`.
- Produto → plano pelas variáveis `WEBHOOK_PRODUTOS_BASICO`, `_COMPLETO` e
  `_UPGRADE` (IDs da GGCheckout, separados por vírgula). Olha `product.id` e
  todos os `products[].id` (order bump e upsell entram na mesma compra) e vale o
  maior acesso. Plano nunca é rebaixado.
- Na GGCheckout o acervo é **um produto só** (`Z3rpkIGhofYxEdQl5a2C`) com ofertas
  de preços diferentes, então o `product.id` não distingue plano. Sem ID
  conhecido, o plano vem do **valor pago**: a partir de
  `WEBHOOK_VALOR_MIN_COMPLETO` (padrão 20) é completo, perto de
  `WEBHOOK_VALOR_UPGRADE` (padrão 12) é upgrade, abaixo disso é básico.
  `amount` é aceito em reais ou centavos.
- `WEBHOOK_PRODUTO_PADRAO` (`basico` | `completo`) é a última rede: compra sem ID
  conhecido e sem valor cai nesse plano em vez de ficar sem acesso.
- O evento `test` da GGCheckout não tem `payment.status`, então é registrado e
  ignorado. Isso é o esperado: o teste dela serve para provar o segredo e a URL.
- Compra aprovada faz upsert em `compras` com e-mail, nome e plano. Não envia
  e-mail nenhum: a cliente recebe o link do app pela própria GGCheckout e entra
  digitando o e-mail.
- Reembolso e chargeback são só registrados; bloquear acesso fica para depois.
- `webhook_log` e o bucket `capas` estão em `supabase/02-webhook-e-admin.sql`.

---

## 12. Fase 6 — Admin de módulos

Rota `/admin`, liberada apenas para os e-mails listados na variável
`ADMIN_EMAILS`.

Formulário para criar e editar módulos: título, descrição, upload da capa para o
Supabase Storage, contador, URL do Drive, plano mínimo, ordem, ativo.

Sem essa tela você cadastra módulo editando banco na mão, e é aí que o projeto
para.

O admin lê e grava `modulos` com a service role (precisa ver os inativos). A capa
sobe direto do navegador para o bucket `capas` com URL assinada gerada no
servidor. O link para o admin aparece na tela Conta, só para os admins.

---

## 13. Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSAO_SECRET=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_WHATSAPP_NUMERO=
NEXT_PUBLIC_INSTAGRAM_URL=
NEXT_PUBLIC_CHECKOUT_UPGRADE_URL=
NEXT_PUBLIC_BANNER_NOVIDADE=
NEXT_PUBLIC_BANNER_NOVIDADE_URL=
WEBHOOK_SECRET=
WEBHOOK_PRODUTOS_BASICO=
WEBHOOK_PRODUTOS_COMPLETO=
WEBHOOK_PRODUTOS_UPGRADE=
WEBHOOK_PRODUTO_PADRAO=
WEBHOOK_VALOR_MIN_COMPLETO=
WEBHOOK_VALOR_UPGRADE=
ADMIN_EMAILS=
```

---

## 14. Ordem de execução

Implemente uma fase por vez, na ordem: 1 → 2 → 3 → 4 → 5 → 6. Ao terminar cada
fase, pare, liste o que foi feito e diga o que preciso testar antes de seguir.

Depois da fase 1, cadastre dois ou três módulos direto pelo painel do Supabase
para conferir a home antes de partir para a calculadora.

---

## 15. Aviso de segurança do acervo

Link de pasta compartilhada do Google Drive vaza e não dá para revogar depois.
Está aceito nesta versão para subir rápido. Assim que houver faturamento, migre
os PDFs para o Supabase Storage com URL assinada de 1 hora — o app já está
estruturado para isso, basta trocar o que `url_drive` aponta.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
