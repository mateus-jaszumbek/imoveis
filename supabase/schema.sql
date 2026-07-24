-- =====================================================
-- SCHEMA: Painel Locadora de Imóveis (multi-tenant)
-- Execute este arquivo no SQL Editor do Supabase (instalação nova).
-- Para atualizar um banco já em uso, veja supabase/migrate-multi-tenant.sql
-- =====================================================

create extension if not exists "uuid-ossp";

-- TABELAS

-- Cada locadora (empresa/administradora) que se cadastra no sistema é isolada
-- das demais — nenhum dado (imóvel, inquilino, locação, etc.) é compartilhado
-- entre locadoras diferentes.
create table public.locadoras (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  criado_em timestamptz default now(),
  trial_termina_em timestamptz not null default (now() + interval '5 days'),
  assinatura_status text not null default 'trial' check (assinatura_status in ('trial', 'ativa', 'atrasada', 'cancelada')),
  asaas_customer_id text,
  asaas_subscription_id text
);

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  locadora_id uuid references public.locadoras(id),
  nome text not null,
  email text not null,
  telefone text,
  cpf text,
  role text not null check (role in ('admin', 'cliente', 'proprietario')),
  consentimento_lgpd_em timestamptz,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Funções de escopo multi-tenant (precisam existir antes das tabelas abaixo,
-- que usam `default public.minha_locadora()` na coluna locadora_id)
create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

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

create table public.imoveis (
  id uuid default uuid_generate_v4() primary key,
  locadora_id uuid references public.locadoras(id) not null default public.minha_locadora(),
  codigo text,
  proprietario_id uuid references public.profiles(id),
  taxa_administracao_pct numeric(5,2) not null default 10,
  tipo text not null check (tipo in ('apartamento', 'casa', 'comercial', 'sala', 'outro')),
  endereco text not null,
  numero text,
  complemento text,
  bairro text,
  cidade text not null,
  uf char(2) not null,
  cep text,
  valor_aluguel numeric(10,2),
  valor_condominio numeric(10,2) default 0,
  valor_iptu numeric(10,2) default 0,
  quartos int default 0,
  area numeric(8,2),
  descricao text,
  status text not null default 'disponivel' check (status in ('disponivel', 'alugado', 'em_analise')),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create table public.imovel_fotos (
  id uuid default uuid_generate_v4() primary key,
  imovel_id uuid references public.imoveis(id) on delete cascade not null,
  url text not null,
  nome_arquivo text,
  ordem int default 0,
  criado_em timestamptz default now()
);

create table public.locacoes (
  id uuid default uuid_generate_v4() primary key,
  locadora_id uuid references public.locadoras(id) not null default public.minha_locadora(),
  imovel_id uuid references public.imoveis(id) not null,
  inquilino_id uuid references public.profiles(id) not null,
  data_inicio date not null,
  data_fim date,
  dia_vencimento int not null check (dia_vencimento between 1 and 31),
  valor numeric(10,2) not null,
  indice_reajuste text,
  seguro_corretora text,
  seguro_apolice text,
  status text not null default 'ativa' check (status in ('ativa', 'encerrada')),
  observacoes text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Um inquilino não pode ter duas locações ativas ao mesmo tempo — sem essa
-- trava, a tela "Meu Imóvel" do cliente quebra silenciosamente (a consulta
-- espera encontrar só uma locação ativa por inquilino).
create unique index locacoes_inquilino_ativa_unica
  on public.locacoes (inquilino_id)
  where status = 'ativa';

create table public.documentos (
  id uuid default uuid_generate_v4() primary key,
  locacao_id uuid references public.locacoes(id) on delete cascade not null,
  tipo text not null check (tipo in ('contrato', 'vistoria_entrada', 'vistoria_saida', 'entrega_chaves', 'rg', 'cpf', 'comprovante_renda', 'extrato', 'apólice', 'outro')),
  nome_arquivo text not null,
  url text not null,
  criado_em timestamptz default now(),
  criado_por uuid references public.profiles(id)
);

create table public.boletos (
  id uuid default uuid_generate_v4() primary key,
  locacao_id uuid references public.locacoes(id) on delete cascade not null,
  mes_referencia text not null,
  vencimento date not null,
  valor numeric(10,2) not null,
  descricao text,
  linha_digitavel text,
  url_pdf text,
  status text not null default 'em_aberto' check (status in ('em_aberto', 'pago', 'vencido')),
  pago_em date,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create table public.despesas (
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

create table public.reajustes (
  id uuid default uuid_generate_v4() primary key,
  locacao_id uuid references public.locacoes(id) on delete cascade not null,
  indice text not null check (indice in ('igpm', 'ipca', 'inpc')),
  percentual_aplicado numeric(6,2) not null,
  valor_anterior numeric(10,2) not null,
  valor_novo numeric(10,2) not null,
  aplicado_em timestamptz default now(),
  criado_por uuid references public.profiles(id)
);

create table public.conversas (
  id uuid default uuid_generate_v4() primary key,
  locacao_id uuid references public.locacoes(id) on delete cascade not null unique,
  criado_em timestamptz default now()
);

create table public.mensagens (
  id uuid default uuid_generate_v4() primary key,
  conversa_id uuid references public.conversas(id) on delete cascade not null,
  autor_id uuid references public.profiles(id) not null,
  autor_role text not null check (autor_role in ('admin', 'cliente')),
  texto text,
  lida boolean default false,
  criado_em timestamptz default now()
);

create table public.mensagem_anexos (
  id uuid default uuid_generate_v4() primary key,
  mensagem_id uuid references public.mensagens(id) on delete cascade not null,
  tipo text not null check (tipo in ('imagem', 'pdf')),
  url text not null,
  nome_arquivo text not null,
  tamanho int,
  criado_em timestamptz default now()
);

-- Agenda: cobre tanto visita a um imóvel disponível (sem locação, com dados
-- de contato do interessado) quanto entrega/retirada de chaves de uma locação
-- (com locacao_id, sem precisar de dados de contato — já tem o inquilino).
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

-- ÍNDICES
create index on public.imoveis(proprietario_id);
create index on public.locacoes(inquilino_id);
create index on public.locacoes(imovel_id);
create index on public.boletos(locacao_id);
create index on public.despesas(imovel_id);
create index on public.despesas(data);
create index on public.reajustes(locacao_id);
create index on public.documentos(locacao_id);
create index on public.mensagens(conversa_id);
create index on public.mensagens(criado_em);
create index on public.conversas(locacao_id);
create index on public.agendamentos(imovel_id);
create index on public.agendamentos(locacao_id);
create index on public.agendamentos(data_hora);

-- TRIGGERS

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger set_updated_at_imoveis before update on public.imoveis for each row execute procedure public.handle_updated_at();
create trigger set_updated_at_locacoes before update on public.locacoes for each row execute procedure public.handle_updated_at();
create trigger set_updated_at_boletos before update on public.boletos for each row execute procedure public.handle_updated_at();
create trigger set_updated_at_despesas before update on public.despesas for each row execute procedure public.handle_updated_at();
create trigger set_updated_at_agendamentos before update on public.agendamentos for each row execute procedure public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_new_locacao()
returns trigger as $$
begin
  insert into public.conversas (locacao_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_locacao_created
  after insert on public.locacoes
  for each row execute procedure public.handle_new_locacao();

-- Funções auxiliares para as policies de proprietário (security definer —
-- rodam sem RLS por dentro). Necessárias porque `imoveis` tem uma policy que
-- consulta `locacoes` e vice-versa: uma policy que fizesse esse cruzamento
-- direto (subquery comum, sujeita a RLS) causaria recursão infinita entre as
-- duas tabelas. A função quebra o ciclo.
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

-- ROW LEVEL SECURITY

alter table public.locadoras enable row level security;
alter table public.profiles enable row level security;
alter table public.imoveis enable row level security;
alter table public.imovel_fotos enable row level security;
alter table public.locacoes enable row level security;
alter table public.documentos enable row level security;
alter table public.boletos enable row level security;
alter table public.despesas enable row level security;
alter table public.reajustes enable row level security;
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;
alter table public.mensagem_anexos enable row level security;
alter table public.agendamentos enable row level security;

-- LOCADORAS (qualquer usuário lê a própria; só o admin dela atualiza —
-- ex: status de assinatura, id de cliente/assinatura no Asaas)
create policy "usuário vê a própria locadora" on public.locadoras for select using (
  id = public.minha_locadora()
);
create policy "admin atualiza a própria locadora" on public.locadoras for update using (
  public.is_admin_da(id)
) with check (
  public.is_admin_da(id)
);

-- PROFILES (admin só vê/gerencia perfis da própria locadora)
create policy "admin vê perfis da sua locadora" on public.profiles for select using (locadora_id = public.minha_locadora());
create policy "cliente vê o próprio" on public.profiles for select using (id = auth.uid());
create policy "admin gerencia perfis da sua locadora" on public.profiles for all
  using (public.is_admin() and locadora_id = public.minha_locadora())
  with check (public.is_admin() and locadora_id = public.minha_locadora());
create policy "cliente atualiza o próprio" on public.profiles for update using (id = auth.uid());

-- IMÓVEIS
create policy "admin gerencia imóveis da sua locadora" on public.imoveis for all
  using (public.is_admin_da(locadora_id)) with check (public.is_admin_da(locadora_id));
create policy "cliente vê o próprio imóvel" on public.imoveis for select using (
  id in (select imovel_id from public.locacoes where inquilino_id = auth.uid() and status = 'ativa')
);
create policy "proprietário vê os próprios imóveis" on public.imoveis for select using (
  proprietario_id = auth.uid()
);

-- FOTOS
create policy "admin gerencia fotos da sua locadora" on public.imovel_fotos for all
  using (imovel_id in (select id from public.imoveis where locadora_id = public.minha_locadora()))
  with check (imovel_id in (select id from public.imoveis where locadora_id = public.minha_locadora()));
create policy "cliente vê fotos do próprio imóvel" on public.imovel_fotos for select using (
  imovel_id in (select imovel_id from public.locacoes where inquilino_id = auth.uid() and status = 'ativa')
);
create policy "proprietário vê fotos dos próprios imóveis" on public.imovel_fotos for select using (
  public.eh_imovel_do_proprietario(imovel_id)
);

-- LOCAÇÕES
create policy "admin gerencia locações da sua locadora" on public.locacoes for all
  using (public.is_admin_da(locadora_id)) with check (public.is_admin_da(locadora_id));
create policy "cliente vê a própria locação" on public.locacoes for select using (inquilino_id = auth.uid());
create policy "proprietário vê locações dos próprios imóveis" on public.locacoes for select using (
  public.eh_imovel_do_proprietario(imovel_id)
);

-- DOCUMENTOS
create policy "admin gerencia documentos da sua locadora" on public.documentos for all
  using (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()))
  with check (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()));
create policy "cliente vê documentos da própria locação" on public.documentos for select using (
  locacao_id in (select id from public.locacoes where inquilino_id = auth.uid())
);
create policy "proprietário vê documentos das locações dos próprios imóveis" on public.documentos for select using (
  public.eh_locacao_do_proprietario(locacao_id)
);

-- BOLETOS
create policy "admin gerencia boletos da sua locadora" on public.boletos for all
  using (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()))
  with check (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()));
create policy "cliente vê boletos da própria locação" on public.boletos for select using (
  locacao_id in (select id from public.locacoes where inquilino_id = auth.uid())
);
create policy "proprietário vê boletos das locações dos próprios imóveis" on public.boletos for select using (
  public.eh_locacao_do_proprietario(locacao_id)
);

-- DESPESAS (admin gerencia; inquilino não tem acesso; proprietário só lê as dos próprios imóveis)
create policy "admin gerencia despesas da sua locadora" on public.despesas for all
  using (public.is_admin_da(locadora_id)) with check (public.is_admin_da(locadora_id));
create policy "proprietário vê despesas dos próprios imóveis" on public.despesas for select using (
  public.eh_imovel_do_proprietario(imovel_id)
);

-- REAJUSTES (admin gerencia; inquilino/proprietário só leem os da própria locação — transparência)
create policy "admin gerencia reajustes da sua locadora" on public.reajustes for all
  using (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()))
  with check (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()));
create policy "cliente vê reajustes da própria locação" on public.reajustes for select using (
  locacao_id in (select id from public.locacoes where inquilino_id = auth.uid())
);
create policy "proprietário vê reajustes das locações dos próprios imóveis" on public.reajustes for select using (
  public.eh_locacao_do_proprietario(locacao_id)
);

-- CONVERSAS
create policy "admin gerencia conversas da sua locadora" on public.conversas for all
  using (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()))
  with check (locacao_id in (select id from public.locacoes where locadora_id = public.minha_locadora()));
create policy "cliente vê a própria conversa" on public.conversas for select using (
  locacao_id in (select id from public.locacoes where inquilino_id = auth.uid())
);

-- MENSAGENS
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
create policy "cliente mensagens da própria conversa" on public.mensagens for all using (
  conversa_id in (
    select c.id from public.conversas c
    join public.locacoes l on l.id = c.locacao_id
    where l.inquilino_id = auth.uid()
  )
);

-- ANEXOS
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
create policy "cliente vê anexos da própria conversa" on public.mensagem_anexos for select using (
  mensagem_id in (
    select m.id from public.mensagens m
    join public.conversas c on c.id = m.conversa_id
    join public.locacoes l on l.id = c.locacao_id
    where l.inquilino_id = auth.uid()
  )
);
create policy "cliente envia anexos" on public.mensagem_anexos for insert with check (
  mensagem_id in (
    select m.id from public.mensagens m
    join public.conversas c on c.id = m.conversa_id
    join public.locacoes l on l.id = c.locacao_id
    where l.inquilino_id = auth.uid()
  )
);

-- AGENDAMENTOS (visita a imóvel / entrega e retirada de chaves)
create policy "admin gerencia agendamentos da sua locadora" on public.agendamentos for all
  using (public.is_admin_da(locadora_id)) with check (public.is_admin_da(locadora_id));
create policy "cliente vê agendamentos da própria locação" on public.agendamentos for select using (
  locacao_id in (select id from public.locacoes where inquilino_id = auth.uid())
);

-- =====================================================
-- STORAGE BUCKETS (criar no Supabase Dashboard > Storage)
-- =====================================================
-- 1. "imovel-fotos"  → público (leitura pública via bucket public=true)
-- 2. "documentos"    → privado (acesso via signed URL)
-- 3. "chat-anexos"   → privado (acesso via signed URL)
--
-- No Dashboard: Storage > New Bucket
--   imovel-fotos: Public = true
--   documentos:   Public = false
--   chat-anexos:  Public = false
--
-- IMPORTANTE: o flag "public" de um bucket só afasta o RLS para LEITURA
-- anônima via /object/public/. Upload/update/delete sempre passam pelo
-- RLS de storage.objects, então as políticas abaixo são obrigatórias.

-- STORAGE: imovel-fotos (só admin da locadora dona do imóvel grava; leitura é pública via bucket)
create policy "admin grava storage imovel-fotos da sua locadora" on storage.objects for all
  using (
    bucket_id = 'imovel-fotos'
    and (storage.foldername(name))[1]::uuid in (select id from public.imoveis where locadora_id = public.minha_locadora())
  )
  with check (
    bucket_id = 'imovel-fotos'
    and (storage.foldername(name))[1]::uuid in (select id from public.imoveis where locadora_id = public.minha_locadora())
  );

-- STORAGE: documentos (privado — path: {locacao_id}/arquivo)
create policy "admin gerencia storage documentos da sua locadora" on storage.objects for all
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select id from public.locacoes where locadora_id = public.minha_locadora())
  )
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select id from public.locacoes where locadora_id = public.minha_locadora())
  );

create policy "cliente vê storage documentos da própria locação" on storage.objects for select
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select id from public.locacoes where inquilino_id = auth.uid())
  );

-- STORAGE: chat-anexos (privado — path: {conversa_id}/arquivo)
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

create policy "cliente vê storage chat-anexos da própria conversa" on storage.objects for select
  using (
    bucket_id = 'chat-anexos'
    and (storage.foldername(name))[1]::uuid in (
      select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id where l.inquilino_id = auth.uid()
    )
  );

create policy "cliente envia storage chat-anexos da própria conversa" on storage.objects for insert
  with check (
    bucket_id = 'chat-anexos'
    and (storage.foldername(name))[1]::uuid in (
      select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id where l.inquilino_id = auth.uid()
    )
  );

-- =====================================================
-- REALTIME (Supabase Cloud faz isso via toggle no Dashboard;
-- em self-hosted precisa habilitar manualmente por tabela)
-- =====================================================
alter publication supabase_realtime add table public.mensagens;
alter publication supabase_realtime add table public.mensagem_anexos;
