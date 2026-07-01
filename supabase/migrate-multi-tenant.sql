-- =====================================================
-- MIGRAÇÃO: multi-tenant (locadoras isoladas) + agenda
-- Rodar uma única vez contra um banco já em produção com dados.
-- Para instalações novas, use supabase/schema.sql (já vem pronto).
-- =====================================================

-- 1. Tabela de locadoras
create table public.locadoras (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  criado_em timestamptz default now()
);

-- 2. Locadora "guarda-chuva" para os dados já existentes
insert into public.locadoras (nome) values ('Locadora Principal') returning id \gset loc_

-- 3. Colunas novas (ainda sem default/not null — precisam do backfill primeiro)
alter table public.profiles add column locadora_id uuid references public.locadoras(id);
alter table public.imoveis add column locadora_id uuid references public.locadoras(id);
alter table public.locacoes add column locadora_id uuid references public.locadoras(id);

-- 4. Backfill dos registros existentes
update public.profiles set locadora_id = :'loc_id';
update public.imoveis set locadora_id = :'loc_id';
update public.locacoes set locadora_id = :'loc_id';

-- 5. Trava not null (profiles fica nullable — preenchido explicitamente por código
--    server-side no cadastro/criação de usuário, não por default de sessão)
alter table public.imoveis alter column locadora_id set not null;
alter table public.locacoes alter column locadora_id set not null;

-- 6. Funções de RLS multi-tenant
create or replace function public.minha_locadora()
returns uuid as $$
  select locadora_id from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.is_admin_da(check_locadora_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and locadora_id = check_locadora_id
  );
$$ language sql security definer stable;

-- 7. Defaults (só valem a partir de agora — não retroagem sobre o backfill acima)
alter table public.imoveis alter column locadora_id set default public.minha_locadora();
alter table public.locacoes alter column locadora_id set default public.minha_locadora();

-- 8. RLS: reescrever policies de admin para escopo por locadora
drop policy "admin vê todos" on public.profiles;
drop policy "admin gerencia" on public.profiles;
create policy "admin vê perfis da sua locadora" on public.profiles for select
  using (locadora_id = public.minha_locadora());
create policy "admin gerencia perfis da sua locadora" on public.profiles for all
  using (public.is_admin() and locadora_id = public.minha_locadora())
  with check (public.is_admin() and locadora_id = public.minha_locadora());

drop policy "admin gerencia imóveis" on public.imoveis;
create policy "admin gerencia imóveis da sua locadora" on public.imoveis for all
  using (public.is_admin_da(locadora_id)) with check (public.is_admin_da(locadora_id));

drop policy "admin gerencia fotos" on public.imovel_fotos;
create policy "admin gerencia fotos da sua locadora" on public.imovel_fotos for all
  using (imovel_id in (select id from public.imoveis where locadora_id = public.minha_locadora()))
  with check (imovel_id in (select id from public.imoveis where locadora_id = public.minha_locadora()));

drop policy "admin gerencia locações" on public.locacoes;
create policy "admin gerencia locações da sua locadora" on public.locacoes for all
  using (public.is_admin_da(locadora_id)) with check (public.is_admin_da(locadora_id));

drop policy "admin gerencia documentos" on public.documentos;
create policy "admin gerencia documentos da sua locadora" on public.documentos for all
  using (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()))
  with check (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()));

drop policy "admin gerencia boletos" on public.boletos;
create policy "admin gerencia boletos da sua locadora" on public.boletos for all
  using (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()))
  with check (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()));

drop policy "admin gerencia conversas" on public.conversas;
create policy "admin gerencia conversas da sua locadora" on public.conversas for all
  using (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()))
  with check (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()));

drop policy "admin gerencia mensagens" on public.mensagens;
create policy "admin gerencia mensagens da sua locadora" on public.mensagens for all
  using (
    conversa_id in (
      select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id
      where l.locadora_id = public.minha_locadora()
    )
  )
  with check (
    conversa_id in (
      select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id
      where l.locadora_id = public.minha_locadora()
    )
  );

drop policy "admin gerencia anexos" on public.mensagem_anexos;
create policy "admin gerencia anexos da sua locadora" on public.mensagem_anexos for all
  using (
    mensagem_id in (
      select m.id from public.mensagens m
      join public.conversas c on c.id = m.conversa_id
      join public.locacoes l on l.id = c.locacao_id
      where l.locadora_id = public.minha_locadora()
    )
  )
  with check (
    mensagem_id in (
      select m.id from public.mensagens m
      join public.conversas c on c.id = m.conversa_id
      join public.locacoes l on l.id = c.locacao_id
      where l.locadora_id = public.minha_locadora()
    )
  );

-- 9. Storage: policies de admin também precisam respeitar a locadora
drop policy "admin grava storage imovel-fotos" on storage.objects;
create policy "admin grava storage imovel-fotos da sua locadora" on storage.objects for all
  using (
    bucket_id = 'imovel-fotos'
    and (storage.foldername(name))[1]::uuid in (select id from public.imoveis where locadora_id = public.minha_locadora())
  )
  with check (
    bucket_id = 'imovel-fotos'
    and (storage.foldername(name))[1]::uuid in (select id from public.imoveis where locadora_id = public.minha_locadora())
  );

drop policy "admin gerencia storage documentos" on storage.objects;
create policy "admin gerencia storage documentos da sua locadora" on storage.objects for all
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select id from public.locacoes where locadora_id = public.minha_locadora())
  )
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select id from public.locacoes where locadora_id = public.minha_locadora())
  );

drop policy "admin gerencia storage chat-anexos" on storage.objects;
create policy "admin gerencia storage chat-anexos da sua locadora" on storage.objects for all
  using (
    bucket_id = 'chat-anexos'
    and (storage.foldername(name))[1]::uuid in (
      select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id where l.locadora_id = public.minha_locadora()
    )
  )
  with check (
    bucket_id = 'chat-anexos'
    and (storage.foldername(name))[1]::uuid in (
      select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id where l.locadora_id = public.minha_locadora()
    )
  );

-- 10. Nova tabela: agendamentos (visita a imóvel + entrega/retirada de chaves)
create table public.agendamentos (
  id uuid default uuid_generate_v4() primary key,
  locadora_id uuid references public.locadoras(id) not null default public.minha_locadora(),
  tipo text not null check (tipo in ('visita', 'entrega_chaves', 'retirada_chaves')),
  imovel_id uuid references public.imoveis(id) not null,
  locacao_id uuid references public.locacoes(id),
  nome_contato text,
  telefone_contato text,
  email_contato text,
  data_hora timestamptz not null,
  status text not null default 'agendado' check (status in ('agendado', 'realizado', 'cancelado')),
  observacoes text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index on public.agendamentos(imovel_id);
create index on public.agendamentos(locacao_id);
create index on public.agendamentos(data_hora);

create trigger set_updated_at_agendamentos before update on public.agendamentos
  for each row execute procedure public.handle_updated_at();

alter table public.agendamentos enable row level security;

create policy "admin gerencia agendamentos da sua locadora" on public.agendamentos for all
  using (public.is_admin_da(locadora_id)) with check (public.is_admin_da(locadora_id));

create policy "cliente vê agendamentos da própria locação" on public.agendamentos for select
  using (locacao_id in (select id from public.locacoes where inquilino_id = auth.uid()));
