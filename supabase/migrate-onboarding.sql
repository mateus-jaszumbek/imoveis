-- =====================================================
-- MIGRAÇÃO: flag de onboarding (tour guiado pós-cadastro)
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
-- =====================================================

alter table public.profiles add column if not exists onboarding_completo boolean not null default false;
