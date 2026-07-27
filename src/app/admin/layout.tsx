import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SidebarAdmin } from '@/components/layout/sidebar-admin'
import { OnboardingGate } from '@/components/onboarding/onboarding-gate'
import { PermissoesProvider } from '@/components/providers/permissoes-provider'
import { buscarPermissoesFuncionario } from '@/lib/permissoes'
import { diasAte } from '@/lib/utils'
import { Clock } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // O papel já foi validado pelo proxy (src/proxy.ts) antes de qualquer
  // requisição chegar aqui — não repetir esse redirecionamento aqui. Duas
  // fontes de verdade independentes (proxy + layout) que às vezes discordam
  // (ex: cookie de sessão instável) já causou loop de redirecionamento em
  // produção (admin ↔ cliente ping-pong).
  //
  // Consulta mínima e crítica (role + locadora_id) — decide o menu inteiro,
  // então fica isolada de qualquer outro campo. `onboarding_completo` vem de
  // uma consulta separada logo abaixo: se aquela falhar (coluna ausente numa
  // migração pendente, por exemplo), só o tour some — não pode derrubar o
  // menu do admin junto, como já aconteceu aqui.
  const { data: profile } = await supabase
    .from('profiles')
    .select('locadora_id, role')
    .eq('id', user.id)
    .single()

  // O proxy só deixa admin/funcionário chegarem em /admin — se essa consulta
  // falhar por qualquer motivo, fail-open como admin (mesmo espírito do
  // "fail-open" usado abaixo pro bloqueio de trial) em vez de esconder o
  // menu inteiro por engano.
  const isAdmin = profile?.role !== 'funcionario'
  const permissoes = isAdmin ? {} : await buscarPermissoesFuncionario(supabase, user.id)

  const { data: onboarding } = await supabase
    .from('profiles')
    .select('onboarding_completo')
    .eq('id', user.id)
    .maybeSingle()

  // Consulta separada e opcional — se falhar, só o banner de trial some, o
  // resto do painel continua funcionando normalmente.
  const { data: locadora } = profile?.locadora_id
    ? await supabase
        .from('locadoras')
        .select('assinatura_status, trial_termina_em')
        .eq('id', profile.locadora_id)
        .maybeSingle()
    : { data: null }

  const diasRestantes = locadora ? diasAte(locadora.trial_termina_em) : 0
  const emTrial = locadora?.assinatura_status === 'trial' && diasRestantes >= 0

  // Mesma regra do proxy (src/proxy.ts) — aqui só controla a aparência do
  // menu (cadeado nos links). Quem realmente impede o acesso é o proxy;
  // fail-open (locadora null) para não travar o menu por uma falha de consulta.
  const trialVencido = locadora ? new Date(locadora.trial_termina_em) < new Date() : false
  const bloqueado = locadora
    ? locadora.assinatura_status === 'atrasada'
      || locadora.assinatura_status === 'cancelada'
      || (locadora.assinatura_status === 'trial' && trialVencido)
    : false

  return (
    <PermissoesProvider isAdmin={isAdmin} permissoes={permissoes}>
      <div className="flex h-screen overflow-hidden">
        <SidebarAdmin bloqueado={bloqueado} isAdmin={isAdmin} permissoes={permissoes} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {emTrial && isAdmin && (
            <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                Seu teste grátis termina em {diasRestantes === 0 ? 'hoje' : diasRestantes === 1 ? '1 dia' : `${diasRestantes} dias`}.
              </span>
              <Link href="/admin/assinatura" className="font-semibold underline underline-offset-2 hover:text-amber-900">
                Assinar agora
              </Link>
            </div>
          )}
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        {isAdmin && <OnboardingGate completo={onboarding?.onboarding_completo ?? true} />}
      </div>
    </PermissoesProvider>
  )
}
