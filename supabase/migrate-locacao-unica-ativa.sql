-- =====================================================
-- MIGRAÇÃO: impede duas locações ativas para o mesmo inquilino
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
-- =====================================================

create unique index if not exists locacoes_inquilino_ativa_unica
  on public.locacoes (inquilino_id)
  where status = 'ativa';
