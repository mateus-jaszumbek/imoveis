import { createClient } from '@/lib/supabase/server'
import { Receipt } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { BoletoAdminList } from '@/components/boletos/boleto-admin-list'

export default async function BoletosPage() {
  const supabase = await createClient()
  const { data: boletos } = await supabase
    .from('boletos')
    .select('*, locacoes(imoveis(endereco, numero), profiles(nome))')
    .order('vencimento', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Boletos"
        description="Gerencie todos os boletos"
      />
      {!boletos?.length ? (
        <EmptyState icon={Receipt} title="Nenhum boleto cadastrado" description="Acesse uma locação para cadastrar boletos." />
      ) : (
        <BoletoAdminList boletos={boletos as any} />
      )}
    </div>
  )
}
