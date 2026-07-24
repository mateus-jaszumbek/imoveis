-- =====================================================
-- MIGRAÇÃO: módulo de despesas (controle financeiro)
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
-- =====================================================

create table if not exists public.despesas (
  id uuid default uuid_generate_v4() primary key,
  locadora_id uuid references public.locadoras(id) not null default public.minha_locadora(),
  imovel_id uuid references public.imoveis(id),
  categoria text not null check (categoria in ('manutencao', 'comissao', 'imposto', 'seguro', 'administracao', 'marketing', 'outro')),
  descricao text,
  valor numeric(10,2) not null,
  data date not null,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists despesas_imovel_id_idx on public.despesas(imovel_id);
create index if not exists despesas_data_idx on public.despesas(data);

drop trigger if exists set_updated_at_despesas on public.despesas;
create trigger set_updated_at_despesas before update on public.despesas for each row execute procedure public.handle_updated_at();

alter table public.despesas enable row level security;

drop policy if exists "admin gerencia despesas da sua locadora" on public.despesas;
create policy "admin gerencia despesas da sua locadora" on public.despesas for all
  using (public.is_admin_da(locadora_id)) with check (public.is_admin_da(locadora_id));
