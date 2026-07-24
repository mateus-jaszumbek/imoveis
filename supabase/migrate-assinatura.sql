-- =====================================================
-- MIGRAÇÃO: trial de 5 dias + assinatura mensal via Asaas
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
-- =====================================================

alter table public.locadoras add column if not exists trial_termina_em timestamptz not null default (now() + interval '5 days');
alter table public.locadoras add column if not exists asaas_customer_id text;
alter table public.locadoras add column if not exists asaas_subscription_id text;

do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'locadoras' and column_name = 'assinatura_status') then
    alter table public.locadoras add column assinatura_status text not null default 'trial';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.locadoras'::regclass and conname = 'locadoras_assinatura_status_check'
  ) then
    alter table public.locadoras add constraint locadoras_assinatura_status_check
      check (assinatura_status in ('trial', 'ativa', 'atrasada', 'cancelada'));
  end if;
end $$;

-- Nota: o "add column if not exists trial_termina_em ... default (now() + interval
-- '5 days')" acima já dá, na primeira vez que essa migração roda, um trial de
-- 5 dias a partir de hoje pras locadoras que já existiam (evita que todo mundo
-- caia bloqueado assim que a migração é aplicada). Rodar de novo é inofensivo
-- — a coluna já existe, o `if not exists` não recalcula nada.

notify pgrst, 'reload schema';
