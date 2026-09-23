-- MVP sem login: a cliente entra digitando o e-mail que usou na compra.
-- Rode no SQL Editor do Supabase depois do 03-em-breve.sql.

-- QUEM COMPROU
-- Alimentada pelo webhook da GGCheckout. A tela de entrada só confere se o
-- e-mail está aqui. Sem policy: só a service role (rota de servidor) acessa.
create table compras (
  id bigserial primary key,
  email text not null unique,
  nome text,
  plano text not null default 'basico',        -- basico | completo
  ativo boolean not null default true,         -- false bloqueia o acesso
  pagamento_id text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table compras enable row level security;

-- EVENTOS DE USO
-- A versão de `eventos` depende de auth.users, que este MVP não usa mais.
create table eventos_uso (
  id bigserial primary key,
  email text,
  tipo text not null,                          -- abriu_modulo | calculou | viu_bloqueado
  ref text,
  criado_em timestamptz default now()
);

alter table eventos_uso enable row level security;

create index eventos_uso_data_idx on eventos_uso (criado_em desc);
