import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { MeusBoletosList } from '@/components/boletos/meus-boletos-list'

export default async function MeusBoletosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: locacao } = await supabase
    .from('locacoes')
    .select('id')
    .eq('inquilino_id', user.id)
    .eq('status', 'ativa')
    .single()

  if (!locacao) {
    return <EmptyState icon={Receipt} title="Sem locação ativa" description="Sem boletos para exibir." />
  }

  const { data: boletos } = await supabase
    .from('boletos')
    .select('*')
    .eq('locacao_id', locacao.id)
    .order('vencimento', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Boletos</h1>
        <p className="text-sm text-gray-500 mt-1">{boletos?.length ?? 0} boletos encontrados</p>
      </div>
      {!boletos?.length ? (
        <EmptyState icon={Receipt} title="Nenhum boleto" description="Seus boletos aparecerão aqui quando a administradora emiti-los." />
      ) : (
        <MeusBoletosList boletos={boletos as any} />
      )}
    </div>
  )
}
