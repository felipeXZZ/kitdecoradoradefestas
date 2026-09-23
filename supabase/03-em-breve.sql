-- Módulos "em breve": aparecem no acervo em preto e branco, sem abrir.
-- Rode no SQL Editor do Supabase depois do 02-webhook-e-admin.sql.
alter table modulos add column em_breve boolean not null default false;
