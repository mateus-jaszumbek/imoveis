-- =====================================================
-- MIGRAÇÃO: RLS + policies na tabela locadoras
-- Rodar uma única vez (idempotente — pode rodar de novo sem erro).
--
-- Motivo: em algum momento a tabela `locadoras` ficou com RLS ativado
-- (provavelmente via um clique no "Security Advisor" do Supabase) sem
-- nenhuma policy — isso bloqueia 100% do acesso via API (authenticated),
-- mesmo com GRANT correto, porque RLS ligado sem policy nega tudo por
-- padrão. O SQL Editor não mostra o problema porque roda como superusuário
-- (bypassa RLS). Esta migração garante RLS ligado *com* as policies certas.
-- =====================================================

alter table public.locadoras enable row level security;

drop policy if exists "usuário vê a própria locadora" on public.locadoras;
create policy "usuário vê a própria locadora" on public.locadoras for select using (
  id = public.minha_locadora()
);

drop policy if exists "admin atualiza a própria locadora" on public.locadoras;
create policy "admin atualiza a própria locadora" on public.locadoras for update using (
  public.is_admin_da(id)
) with check (
  public.is_admin_da(id)
);

notify pgrst, 'reload schema';
