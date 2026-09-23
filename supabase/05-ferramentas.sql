-- Fase 2 — ferramentas (perfil do negócio, orçamentos, documentos, scripts).
-- Rode no SQL Editor do Supabase depois do 04-mvp-sem-login.sql.
--
-- Sem Supabase Auth neste MVP: a chave é o e-mail da compra (ver CLAUDE.md,
-- seção 5). Por isso não existe `auth.uid()` nas policies; estas tabelas são
-- acessadas só por rota de servidor com a service role.

-- PERFIL DO NEGÓCIO
-- Preenchido uma vez; alimenta o cabeçalho de todo orçamento e documento.
create table perfil_negocio (
  email text primary key,
  nome_negocio text,
  nome_responsavel text,
  telefone text,
  cidade text,
  documento text,                       -- CPF ou CNPJ, opcional
  logo_path text,                       -- caminho no bucket privado `logos`
  validade_padrao_dias int not null default 7,
  percentual_sinal int not null default 50,
  condicoes_padrao text,
  proximo_numero int not null default 1,
  atualizado_em timestamptz default now()
);

alter table perfil_negocio enable row level security;

-- ORÇAMENTOS
create table orcamentos (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  numero int not null,
  cliente_nome text not null,
  cliente_telefone text,
  data_festa date,
  local_festa text,
  projeto_id text,                      -- módulo do acervo, se veio de um
  projeto_titulo text,
  itens jsonb not null,                 -- [{descricao, quantidade}]
  valor_total numeric not null,
  valor_sinal numeric not null,
  validade date not null,
  condicoes text,
  status text not null default 'enviado', -- enviado | aceito | recusado
  pdf_path text,
  criado_em timestamptz default now()
);

alter table orcamentos enable row level security;

create index orcamentos_email_idx on orcamentos (email, criado_em desc);
create unique index orcamentos_numero_idx on orcamentos (email, numero);

-- Número do orçamento: reservado no banco, com lock, nunca no cliente. Dois
-- orçamentos com o mesmo número na frente de dois clientes destrói credibilidade.
create or replace function public.proximo_numero_orcamento(p_email text)
returns int language plpgsql security definer as $$
declare
  n int;
begin
  insert into perfil_negocio (email) values (p_email)
  on conflict (email) do nothing;

  select proximo_numero into n from perfil_negocio where email = p_email for update;
  update perfil_negocio set proximo_numero = n + 1, atualizado_em = now() where email = p_email;
  return n;
end;
$$;

revoke all on function public.proximo_numero_orcamento(text) from anon, authenticated;

-- MODELOS DE DOCUMENTO
-- `corpo` usa {{variaveis}} substituídas na geração do PDF.
create table documentos_modelo (
  id uuid primary key default gen_random_uuid(),
  tipo text not null unique,            -- contrato | termo | recibo | checklist
  titulo text not null,
  descricao text,
  corpo text not null,
  ordem int default 0,
  ativo boolean not null default true
);

alter table documentos_modelo enable row level security;
create policy "ler modelos" on documentos_modelo for select using (ativo);

-- SCRIPTS DE WHATSAPP
create table scripts (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,              -- orcamento | objecao | sinal | followup | indicacao
  titulo text not null,
  corpo text not null,
  ordem int default 0,
  ativo boolean not null default true
);

alter table scripts enable row level security;
create policy "ler scripts" on scripts for select using (ativo);

create index scripts_ordem_idx on scripts (categoria, ordem) where ativo;

-- ARQUIVOS
-- Privados: logo e PDFs são material comercial dela. O acesso sai por URL
-- assinada gerada no servidor; nenhuma policy de usuário é necessária.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
