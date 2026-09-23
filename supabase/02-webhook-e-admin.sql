-- Fases 5 e 6. Rode no SQL Editor do Supabase depois do schema.sql.

-- LOG DO WEBHOOK DE COMPRA
-- Toda requisição recebida fica aqui, com o payload cru: é a sua defesa em
-- contestação de compra. Só a service role (rota de servidor) lê e grava.
create table webhook_log (
  id bigserial primary key,
  recebido_em timestamptz default now(),
  status text not null,             -- recebido | processado | ignorado | assinatura_invalida | erro
  detalhe text,
  email text,
  produto text,
  payload text not null
);

alter table webhook_log enable row level security;
-- Sem policy de propósito: ninguém com a chave pública acessa esta tabela.

create index webhook_log_data_idx  on webhook_log (recebido_em desc);
create index webhook_log_email_idx on webhook_log (email);

-- Busca de perfil por e-mail no webhook (o Supabase Auth grava e-mail em minúsculas).
create index profiles_email_idx on profiles (email);

-- CAPAS DOS MÓDULOS (admin)
-- Bucket público: as capas são lidas pelo transform de imagem.
-- O upload é feito com URL assinada gerada no servidor, então não precisa de
-- policy de escrita para usuários.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('capas', 'capas', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
