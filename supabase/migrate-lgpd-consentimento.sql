-- =====================================================
-- MIGRAÇÃO: registra quando o titular consentiu com o tratamento de dados
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
-- =====================================================

alter table public.profiles add column if not exists consentimento_lgpd_em timestamptz;
