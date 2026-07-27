-- =====================================================
-- MIGRAÇÃO: funcionários com login próprio e permissões por seção
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
-- =====================================================

-- Permite o novo papel 'funcionario' em profiles.role. O nome da constraint
-- de CHECK é descoberto dinamicamente (mesmo padrão de migrate-proprietarios.sql).
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
    check (role in ('admin', 'cliente', 'proprietario', 'funcionario'));
end $$;

-- Permite bloquear o acesso de um funcionário sem apagar o cadastro (histórico
-- de autoria em registros antigos, se houver, é preservado). Sempre true para
-- os demais papéis.
alter table public.profiles add column if not exists ativo boolean not null default true;

-- Uma linha por (funcionário, seção) — a ausência de linha = seção invisível.
-- 'financeiro' nunca tem pode_editar (é um relatório, não tem formulário).
create table if not exists public.funcionario_permissoes (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  secao text not null check (secao in (
    'financeiro', 'imoveis', 'inquilinos', 'proprietarios', 'locacoes',
    'agenda', 'boletos', 'documentos', 'mensagens'
  )),
  pode_editar boolean not null default false,
  criado_em timestamptz default now(),
  unique (profile_id, secao)
);

alter table public.funcionario_permissoes enable row level security;

-- Função central: admin sempre tem acesso total; funcionário só se tiver a
-- linha de permissão correspondente (e estiver ativo). `precisa_editar=false`
-- (padrão) cobre "ver" — qualquer uma das duas permissões (ver ou editar)
-- concede leitura, já que editar sem poder ver não faz sentido.
create or replace function public.tem_permissao(check_locadora_id uuid, secao text, precisa_editar boolean default false)
returns boolean as $$
  select
    public.is_admin_da(check_locadora_id)
    or exists (
      select 1
      from public.funcionario_permissoes fp
      join public.profiles p on p.id = fp.profile_id
      where fp.profile_id = auth.uid()
        and p.role = 'funcionario'
        and p.ativo = true
        and p.locadora_id = check_locadora_id
        and fp.secao = tem_permissao.secao
        and (not tem_permissao.precisa_editar or fp.pode_editar)
    );
$$ language sql security definer stable;

-- Imóveis e locações são o "pano de fundo" de quase toda outra tela (um
-- boleto mostra o endereço do imóvel, uma mensagem mostra a locação, etc.).
-- Em vez de reexpor essas duas tabelas seção por seção, qualquer funcionário
-- com pelo menos UMA permissão concedida enxerga (somente leitura) imóveis e
-- locações da própria locadora — quem edita imóveis/locações continua
-- exigindo a permissão específica de 'imoveis'/'locacoes'.
create or replace function public.tem_alguma_permissao(check_locadora_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.funcionario_permissoes fp
    join public.profiles p on p.id = fp.profile_id
    where fp.profile_id = auth.uid()
      and p.role = 'funcionario'
      and p.ativo = true
      and p.locadora_id = check_locadora_id
  );
$$ language sql security definer stable;

-- RLS de funcionario_permissoes: admin gerencia as permissões dos
-- funcionários da própria locadora; o funcionário só lê as próprias linhas
-- (a tela dele precisa saber o que mostrar/esconder), nunca escreve.
drop policy if exists "admin gerencia permissões dos funcionários da sua locadora" on public.funcionario_permissoes;
create policy "admin gerencia permissões dos funcionários da sua locadora" on public.funcionario_permissoes for all using (
  exists (
    select 1 from public.profiles p
    where p.id = funcionario_permissoes.profile_id and public.is_admin_da(p.locadora_id)
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = funcionario_permissoes.profile_id and public.is_admin_da(p.locadora_id)
  )
);

drop policy if exists "funcionário vê as próprias permissões" on public.funcionario_permissoes;
create policy "funcionário vê as próprias permissões" on public.funcionario_permissoes for select using (
  profile_id = auth.uid()
);

-- =====================================================
-- PROFILES — funcionário com permissão em 'inquilinos'/'proprietarios' pode
-- ver/editar APENAS perfis com o role correspondente (nunca admin/funcionario
-- de outra pessoa — isso continua exclusivo da policy "admin gerencia perfis").
-- =====================================================
drop policy if exists "funcionário vê inquilinos com permissão" on public.profiles;
create policy "funcionário vê inquilinos com permissão" on public.profiles for select using (
  role = 'cliente' and locadora_id = public.minha_locadora() and public.tem_permissao(locadora_id, 'inquilinos')
);
drop policy if exists "funcionário edita inquilinos com permissão" on public.profiles;
create policy "funcionário edita inquilinos com permissão" on public.profiles for update using (
  role = 'cliente' and locadora_id = public.minha_locadora() and public.tem_permissao(locadora_id, 'inquilinos', true)
) with check (
  role = 'cliente' and locadora_id = public.minha_locadora() and public.tem_permissao(locadora_id, 'inquilinos', true)
);
drop policy if exists "funcionário vê proprietários com permissão" on public.profiles;
create policy "funcionário vê proprietários com permissão" on public.profiles for select using (
  role = 'proprietario' and locadora_id = public.minha_locadora() and public.tem_permissao(locadora_id, 'proprietarios')
);
drop policy if exists "funcionário edita proprietários com permissão" on public.profiles;
create policy "funcionário edita proprietários com permissão" on public.profiles for update using (
  role = 'proprietario' and locadora_id = public.minha_locadora() and public.tem_permissao(locadora_id, 'proprietarios', true)
) with check (
  role = 'proprietario' and locadora_id = public.minha_locadora() and public.tem_permissao(locadora_id, 'proprietarios', true)
);

-- =====================================================
-- IMÓVEIS (governa também despesas — lançadas na própria ficha do imóvel)
-- =====================================================
drop policy if exists "admin gerencia imóveis da sua locadora" on public.imoveis;
drop policy if exists "imóveis: ver com permissão" on public.imoveis;
create policy "imóveis: ver com permissão" on public.imoveis for select using (
  public.tem_permissao(locadora_id, 'imoveis') or public.tem_alguma_permissao(locadora_id)
);
drop policy if exists "imóveis: editar com permissão" on public.imoveis;
create policy "imóveis: editar com permissão" on public.imoveis for insert with check (
  public.tem_permissao(locadora_id, 'imoveis', true)
);
drop policy if exists "imóveis: atualizar com permissão" on public.imoveis;
create policy "imóveis: atualizar com permissão" on public.imoveis for update using (
  public.tem_permissao(locadora_id, 'imoveis', true)
) with check (
  public.tem_permissao(locadora_id, 'imoveis', true)
);
drop policy if exists "imóveis: apagar com permissão" on public.imoveis;
create policy "imóveis: apagar com permissão" on public.imoveis for delete using (
  public.tem_permissao(locadora_id, 'imoveis', true)
);

drop policy if exists "admin gerencia fotos da sua locadora" on public.imovel_fotos;
drop policy if exists "fotos: ver com permissão do imóvel" on public.imovel_fotos;
create policy "fotos: ver com permissão do imóvel" on public.imovel_fotos for select using (
  imovel_id in (select id from public.imoveis i where public.tem_permissao(i.locadora_id, 'imoveis'))
);
drop policy if exists "fotos: adicionar com permissão do imóvel" on public.imovel_fotos;
create policy "fotos: adicionar com permissão do imóvel" on public.imovel_fotos for insert with check (
  imovel_id in (select id from public.imoveis i where public.tem_permissao(i.locadora_id, 'imoveis', true))
);
drop policy if exists "fotos: atualizar com permissão do imóvel" on public.imovel_fotos;
create policy "fotos: atualizar com permissão do imóvel" on public.imovel_fotos for update using (
  imovel_id in (select id from public.imoveis i where public.tem_permissao(i.locadora_id, 'imoveis', true))
) with check (
  imovel_id in (select id from public.imoveis i where public.tem_permissao(i.locadora_id, 'imoveis', true))
);
drop policy if exists "fotos: apagar com permissão do imóvel" on public.imovel_fotos;
create policy "fotos: apagar com permissão do imóvel" on public.imovel_fotos for delete using (
  imovel_id in (select id from public.imoveis i where public.tem_permissao(i.locadora_id, 'imoveis', true))
);

drop policy if exists "admin gerencia despesas da sua locadora" on public.despesas;
drop policy if exists "despesas: ver com permissão de imóveis" on public.despesas;
create policy "despesas: ver com permissão de imóveis" on public.despesas for select using (
  public.tem_permissao(locadora_id, 'imoveis') or public.tem_permissao(locadora_id, 'financeiro')
);
drop policy if exists "despesas: gerenciar com permissão de imóveis" on public.despesas;
create policy "despesas: gerenciar com permissão de imóveis" on public.despesas for insert with check (
  public.tem_permissao(locadora_id, 'imoveis', true)
);
drop policy if exists "despesas: atualizar com permissão de imóveis" on public.despesas;
create policy "despesas: atualizar com permissão de imóveis" on public.despesas for update using (
  public.tem_permissao(locadora_id, 'imoveis', true)
) with check (
  public.tem_permissao(locadora_id, 'imoveis', true)
);
drop policy if exists "despesas: apagar com permissão de imóveis" on public.despesas;
create policy "despesas: apagar com permissão de imóveis" on public.despesas for delete using (
  public.tem_permissao(locadora_id, 'imoveis', true)
);

-- =====================================================
-- LOCAÇÕES (governa também reajustes — aplicados na própria ficha da locação)
-- =====================================================
drop policy if exists "admin gerencia locações da sua locadora" on public.locacoes;
drop policy if exists "locações: ver com permissão" on public.locacoes;
create policy "locações: ver com permissão" on public.locacoes for select using (
  public.tem_permissao(locadora_id, 'locacoes') or public.tem_alguma_permissao(locadora_id)
);
drop policy if exists "locações: criar com permissão" on public.locacoes;
create policy "locações: criar com permissão" on public.locacoes for insert with check (
  public.tem_permissao(locadora_id, 'locacoes', true)
);
drop policy if exists "locações: atualizar com permissão" on public.locacoes;
create policy "locações: atualizar com permissão" on public.locacoes for update using (
  public.tem_permissao(locadora_id, 'locacoes', true)
) with check (
  public.tem_permissao(locadora_id, 'locacoes', true)
);
drop policy if exists "locações: apagar com permissão" on public.locacoes;
create policy "locações: apagar com permissão" on public.locacoes for delete using (
  public.tem_permissao(locadora_id, 'locacoes', true)
);

drop policy if exists "admin gerencia reajustes da sua locadora" on public.reajustes;
drop policy if exists "reajustes: ver com permissão de locações" on public.reajustes;
create policy "reajustes: ver com permissão de locações" on public.reajustes for select using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'locacoes'))
);
drop policy if exists "reajustes: gerenciar com permissão de locações" on public.reajustes;
create policy "reajustes: gerenciar com permissão de locações" on public.reajustes for insert with check (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'locacoes', true))
);
drop policy if exists "reajustes: atualizar com permissão de locações" on public.reajustes;
create policy "reajustes: atualizar com permissão de locações" on public.reajustes for update using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'locacoes', true))
) with check (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'locacoes', true))
);
drop policy if exists "reajustes: apagar com permissão de locações" on public.reajustes;
create policy "reajustes: apagar com permissão de locações" on public.reajustes for delete using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'locacoes', true))
);

-- =====================================================
-- DOCUMENTOS
-- =====================================================
drop policy if exists "admin gerencia documentos da sua locadora" on public.documentos;
drop policy if exists "documentos: ver com permissão" on public.documentos;
create policy "documentos: ver com permissão" on public.documentos for select using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'documentos'))
);
drop policy if exists "documentos: gerenciar com permissão" on public.documentos;
create policy "documentos: gerenciar com permissão" on public.documentos for insert with check (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'documentos', true))
);
drop policy if exists "documentos: atualizar com permissão" on public.documentos;
create policy "documentos: atualizar com permissão" on public.documentos for update using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'documentos', true))
) with check (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'documentos', true))
);
drop policy if exists "documentos: apagar com permissão" on public.documentos;
create policy "documentos: apagar com permissão" on public.documentos for delete using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'documentos', true))
);

-- =====================================================
-- BOLETOS
-- =====================================================
drop policy if exists "admin gerencia boletos da sua locadora" on public.boletos;
drop policy if exists "boletos: ver com permissão" on public.boletos;
create policy "boletos: ver com permissão" on public.boletos for select using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'boletos') or public.tem_permissao(l.locadora_id, 'financeiro'))
);
drop policy if exists "boletos: criar com permissão" on public.boletos;
create policy "boletos: criar com permissão" on public.boletos for insert with check (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'boletos', true))
);
drop policy if exists "boletos: atualizar com permissão" on public.boletos;
create policy "boletos: atualizar com permissão" on public.boletos for update using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'boletos', true))
) with check (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'boletos', true))
);
drop policy if exists "boletos: apagar com permissão" on public.boletos;
create policy "boletos: apagar com permissão" on public.boletos for delete using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'boletos', true))
);

-- =====================================================
-- AGENDA
-- =====================================================
drop policy if exists "admin gerencia agendamentos da sua locadora" on public.agendamentos;
drop policy if exists "agenda: ver com permissão" on public.agendamentos;
create policy "agenda: ver com permissão" on public.agendamentos for select using (
  public.tem_permissao(locadora_id, 'agenda')
);
drop policy if exists "agenda: criar com permissão" on public.agendamentos;
create policy "agenda: criar com permissão" on public.agendamentos for insert with check (
  public.tem_permissao(locadora_id, 'agenda', true)
);
drop policy if exists "agenda: atualizar com permissão" on public.agendamentos;
create policy "agenda: atualizar com permissão" on public.agendamentos for update using (
  public.tem_permissao(locadora_id, 'agenda', true)
) with check (
  public.tem_permissao(locadora_id, 'agenda', true)
);
drop policy if exists "agenda: apagar com permissão" on public.agendamentos;
create policy "agenda: apagar com permissão" on public.agendamentos for delete using (
  public.tem_permissao(locadora_id, 'agenda', true)
);

-- =====================================================
-- MENSAGENS / CONVERSAS
-- =====================================================
drop policy if exists "admin gerencia conversas da sua locadora" on public.conversas;
drop policy if exists "conversas: ver com permissão de mensagens" on public.conversas;
create policy "conversas: ver com permissão de mensagens" on public.conversas for select using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'mensagens'))
);
drop policy if exists "conversas: gerenciar com permissão de mensagens" on public.conversas;
create policy "conversas: gerenciar com permissão de mensagens" on public.conversas for insert with check (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'mensagens', true))
);
drop policy if exists "conversas: atualizar com permissão de mensagens" on public.conversas;
create policy "conversas: atualizar com permissão de mensagens" on public.conversas for update using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'mensagens', true))
) with check (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'mensagens', true))
);
drop policy if exists "conversas: apagar com permissão de mensagens" on public.conversas;
create policy "conversas: apagar com permissão de mensagens" on public.conversas for delete using (
  locacao_id in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'mensagens', true))
);

drop policy if exists "admin gerencia mensagens da sua locadora" on public.mensagens;
drop policy if exists "mensagens: ver com permissão" on public.mensagens;
create policy "mensagens: ver com permissão" on public.mensagens for select using (
  conversa_id in (
    select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id
    where public.tem_permissao(l.locadora_id, 'mensagens')
  )
);
drop policy if exists "mensagens: enviar com permissão" on public.mensagens;
create policy "mensagens: enviar com permissão" on public.mensagens for insert with check (
  conversa_id in (
    select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id
    where public.tem_permissao(l.locadora_id, 'mensagens', true)
  )
);
drop policy if exists "mensagens: marcar como lida com permissão" on public.mensagens;
create policy "mensagens: marcar como lida com permissão" on public.mensagens for update using (
  conversa_id in (
    select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id
    where public.tem_permissao(l.locadora_id, 'mensagens')
  )
) with check (
  conversa_id in (
    select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id
    where public.tem_permissao(l.locadora_id, 'mensagens')
  )
);
drop policy if exists "mensagens: apagar com permissão" on public.mensagens;
create policy "mensagens: apagar com permissão" on public.mensagens for delete using (
  conversa_id in (
    select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id
    where public.tem_permissao(l.locadora_id, 'mensagens', true)
  )
);

drop policy if exists "admin gerencia anexos da sua locadora" on public.mensagem_anexos;
drop policy if exists "anexos: ver com permissão de mensagens" on public.mensagem_anexos;
create policy "anexos: ver com permissão de mensagens" on public.mensagem_anexos for select using (
  mensagem_id in (
    select m.id from public.mensagens m
    join public.conversas c on c.id = m.conversa_id
    join public.locacoes l on l.id = c.locacao_id
    where public.tem_permissao(l.locadora_id, 'mensagens')
  )
);
drop policy if exists "anexos: enviar com permissão de mensagens" on public.mensagem_anexos;
create policy "anexos: enviar com permissão de mensagens" on public.mensagem_anexos for insert with check (
  mensagem_id in (
    select m.id from public.mensagens m
    join public.conversas c on c.id = m.conversa_id
    join public.locacoes l on l.id = c.locacao_id
    where public.tem_permissao(l.locadora_id, 'mensagens', true)
  )
);
drop policy if exists "anexos: apagar com permissão de mensagens" on public.mensagem_anexos;
create policy "anexos: apagar com permissão de mensagens" on public.mensagem_anexos for delete using (
  mensagem_id in (
    select m.id from public.mensagens m
    join public.conversas c on c.id = m.conversa_id
    join public.locacoes l on l.id = c.locacao_id
    where public.tem_permissao(l.locadora_id, 'mensagens', true)
  )
);

-- =====================================================
-- STORAGE — as 3 policies antigas ("admin grava/gerencia storage X da sua
-- locadora") na verdade nunca checavam role = 'admin', só se `minha_locadora()`
-- batia — ou seja, qualquer usuário autenticado da locadora (inclusive
-- cliente/proprietário) já conseguia gravar/apagar arquivo de qualquer pasta
-- via chamada direta à API de storage, não só pela tela. Aproveitando que
-- preciso reescrever essas 3 policies para o funcionário, já fecho essa
-- brecha trocando `minha_locadora()` solto por `tem_permissao(...)`.
-- =====================================================
drop policy if exists "admin grava storage imovel-fotos da sua locadora" on storage.objects;
drop policy if exists "storage imovel-fotos: ver com permissão" on storage.objects;
create policy "storage imovel-fotos: ver com permissão" on storage.objects for select using (
  bucket_id = 'imovel-fotos'
  and (storage.foldername(name))[1]::uuid in (select id from public.imoveis i where public.tem_permissao(i.locadora_id, 'imoveis'))
);
drop policy if exists "storage imovel-fotos: gravar com permissão" on storage.objects;
create policy "storage imovel-fotos: gravar com permissão" on storage.objects for insert with check (
  bucket_id = 'imovel-fotos'
  and (storage.foldername(name))[1]::uuid in (select id from public.imoveis i where public.tem_permissao(i.locadora_id, 'imoveis', true))
);
drop policy if exists "storage imovel-fotos: apagar com permissão" on storage.objects;
create policy "storage imovel-fotos: apagar com permissão" on storage.objects for delete using (
  bucket_id = 'imovel-fotos'
  and (storage.foldername(name))[1]::uuid in (select id from public.imoveis i where public.tem_permissao(i.locadora_id, 'imoveis', true))
);

drop policy if exists "admin gerencia storage documentos da sua locadora" on storage.objects;
drop policy if exists "storage documentos: ver com permissão" on storage.objects;
create policy "storage documentos: ver com permissão" on storage.objects for select using (
  bucket_id = 'documentos'
  and (storage.foldername(name))[1]::uuid in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'documentos'))
);
drop policy if exists "storage documentos: gravar com permissão" on storage.objects;
create policy "storage documentos: gravar com permissão" on storage.objects for insert with check (
  bucket_id = 'documentos'
  and (storage.foldername(name))[1]::uuid in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'documentos', true))
);
drop policy if exists "storage documentos: apagar com permissão" on storage.objects;
create policy "storage documentos: apagar com permissão" on storage.objects for delete using (
  bucket_id = 'documentos'
  and (storage.foldername(name))[1]::uuid in (select id from public.locacoes l where public.tem_permissao(l.locadora_id, 'documentos', true))
);

drop policy if exists "admin gerencia storage chat-anexos da sua locadora" on storage.objects;
drop policy if exists "storage chat-anexos: ver com permissão" on storage.objects;
create policy "storage chat-anexos: ver com permissão" on storage.objects for select using (
  bucket_id = 'chat-anexos'
  and (storage.foldername(name))[1]::uuid in (
    select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id where public.tem_permissao(l.locadora_id, 'mensagens')
  )
);
drop policy if exists "storage chat-anexos: gravar com permissão" on storage.objects;
create policy "storage chat-anexos: gravar com permissão" on storage.objects for insert with check (
  bucket_id = 'chat-anexos'
  and (storage.foldername(name))[1]::uuid in (
    select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id where public.tem_permissao(l.locadora_id, 'mensagens', true)
  )
);
drop policy if exists "storage chat-anexos: apagar com permissão" on storage.objects;
create policy "storage chat-anexos: apagar com permissão" on storage.objects for delete using (
  bucket_id = 'chat-anexos'
  and (storage.foldername(name))[1]::uuid in (
    select c.id from public.conversas c join public.locacoes l on l.id = c.locacao_id where public.tem_permissao(l.locadora_id, 'mensagens', true)
  )
);

-- Recarrega o cache de schema do PostgREST.
notify pgrst, 'reload schema';
