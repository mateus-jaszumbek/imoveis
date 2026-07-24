import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SidebarAdmin } from '@/components/layout/sidebar-admin'
import { diasAte } from '@/lib/utils'
import { Clock } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, locadoras(assinatura_status, trial_termina_em)')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'proprietario') redirect('/proprietario/meus-imoveis')
  if (profile?.role !== 'admin') redirect('/cliente/meu-imovel')

  const locadora = profile.locadoras as unknown as { assinatura_status: string; trial_termina_em: string } | null
  const diasRestantes = locadora ? diasAte(locadora.trial_termina_em) : 0
  const emTrial = locadora?.assinatura_status === 'trial' && diasRestantes >= 0

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarAdmin />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {emTrial && (
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
    </div>
  )
}
