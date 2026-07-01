import { createClient } from '@/lib/supabase/server'
import { MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { CaixaMensagens } from '@/components/chat/caixa-mensagens'

export default async function MensagensPage() {
  const supabase = await createClient()
  const { data: conversas } = await supabase
    .from('conversas')
    .select(`
      id,
      locacao_id,
      locacoes(
        profiles(id, nome, email),
        imoveis(endereco, numero)
      ),
      mensagens(id, texto, criado_em, lida, autor_role)
    `)
    .order('criado_em', { ascending: false })

  return (
    <div>
      <PageHeader title="Mensagens" description="Todas as conversas com inquilinos" />
      {!conversas?.length ? (
        <EmptyState icon={MessageSquare} title="Nenhuma conversa ainda" description="As conversas aparecem automaticamente quando locações são criadas." />
      ) : (
        <CaixaMensagens conversas={conversas as any} />
      )}
    </div>
  )
}
