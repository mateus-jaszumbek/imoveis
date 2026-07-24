-- =====================================================
-- MIGRAÇÃO: histórico de reajustes de contrato por índice (IGPM/IPCA/INPC)
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
-- =====================================================

create table if not exists public.reajustes (
  id uuid default uuid_generate_v4() primary key,
  locacao_id uuid references public.locacoes(id) on delete cascade not null,
  indice text not null check (indice in ('igpm', 'ipca', 'inpc')),
  percentual_aplicado numeric(6,2) not null,
  valor_anterior numeric(10,2) not null,
  valor_novo numeric(10,2) not null,
  aplicado_em timestamptz default now(),
  criado_por uuid references public.profiles(id)
);

create index if not exists reajustes_locacao_id_idx on public.reajustes(locacao_id);

alter table public.reajustes enable row level security;

drop policy if exists "admin gerencia reajustes da sua locadora" on public.reajustes;
create policy "admin gerencia reajustes da sua locadora" on public.reajustes for all
  using (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()))
  with check (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()));

drop policy if exists "cliente vê reajustes da própria locação" on public.reajustes;
create policy "cliente vê reajustes da própria locação" on public.reajustes for select using (
  locacao_id in (select id from public.locacoes where inquilino_id = auth.uid())
);

-- Depende da função public.eh_locacao_do_proprietario, criada em
-- migrate-proprietarios.sql — rode aquela migração antes desta se ainda não
-- tiver rodado.
drop policy if exists "proprietário vê reajustes das locações dos próprios imóveis" on public.reajustes;
create policy "proprietário vê reajustes das locações dos próprios imóveis" on public.reajustes for select using (
  public.eh_locacao_do_proprietario(locacao_id)
);

notify pgrst, 'reload schema';
