-- =====================================================
-- MIGRAÇÃO: proprietários de imóveis (repasse automático + portal do proprietário)
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
-- =====================================================

-- Permite o novo papel 'proprietario' em profiles.role. O nome da constraint
-- de CHECK é descoberto dinamicamente (evita depender do nome default do
-- Postgres, que pode variar conforme como a tabela foi originalmente criada).
do $$
declare
  nome_constraint text;
begin
  select conname into nome_constraint
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%in%';

  if nome_constraint is not null then
    execute format('alter table public.profiles drop constraint %I', nome_constraint);
  end if;

  alter table public.profiles add constraint profiles_role_check
    check (role in ('admin', 'cliente', 'proprietario'));
end $$;

alter table public.imoveis add column if not exists proprietario_id uuid references public.profiles(id);
alter table public.imoveis add column if not exists taxa_administracao_pct numeric(5,2) not null default 10;

create index if not exists imoveis_proprietario_id_idx on public.imoveis(proprietario_id);

-- Funções auxiliares (security definer) — evitam recursão infinita entre as
-- RLS policies de `imoveis` e `locacoes` (que se referenciam mutuamente).
create or replace function public.eh_imovel_do_proprietario(check_imovel_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.imoveis where id = check_imovel_id and proprietario_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.eh_locacao_do_proprietario(check_locacao_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.locacoes l
    join public.imoveis i on i.id = l.imovel_id
    where l.id = check_locacao_id and i.proprietario_id = auth.uid()
  );
$$ language sql security definer stable;

drop policy if exists "proprietário vê os próprios imóveis" on public.imoveis;
create policy "proprietário vê os próprios imóveis" on public.imoveis for select using (
  proprietario_id = auth.uid()
);

drop policy if exists "proprietário vê fotos dos próprios imóveis" on public.imovel_fotos;
create policy "proprietário vê fotos dos próprios imóveis" on public.imovel_fotos for select using (
  public.eh_imovel_do_proprietario(imovel_id)
);

drop policy if exists "proprietário vê locações dos próprios imóveis" on public.locacoes;
create policy "proprietário vê locações dos próprios imóveis" on public.locacoes for select using (
  public.eh_imovel_do_proprietario(imovel_id)
);

drop policy if exists "proprietário vê documentos das locações dos próprios imóveis" on public.documentos;
create policy "proprietário vê documentos das locações dos próprios imóveis" on public.documentos for select using (
  public.eh_locacao_do_proprietario(locacao_id)
);

drop policy if exists "proprietário vê boletos das locações dos próprios imóveis" on public.boletos;
create policy "proprietário vê boletos das locações dos próprios imóveis" on public.boletos for select using (
  public.eh_locacao_do_proprietario(locacao_id)
);

drop policy if exists "proprietário vê despesas dos próprios imóveis" on public.despesas;
create policy "proprietário vê despesas dos próprios imóveis" on public.despesas for select using (
  public.eh_imovel_do_proprietario(imovel_id)
);

-- Recarrega o cache de schema do PostgREST (senão colunas/policies novas só
-- passam a valer depois de um restart do serviço `rest`).
notify pgrst, 'reload schema';
