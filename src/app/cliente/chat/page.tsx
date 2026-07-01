import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { ChatCliente } from '@/components/chat/chat-cliente'

export default async function ChatClientePage() {
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
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <EmptyState icon={MessageSquare} title="Sem locação ativa" description="Entre em contato com a administradora para ativar sua locação." />
      </div>
    )
  }

  const { data: conversa } = await supabase
    .from('conversas')
    .select('id')
    .eq('locacao_id', locacao.id)
    .single()

  if (!conversa) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <EmptyState icon={MessageSquare} title="Chat em preparação" description="O chat será ativado em breve." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="text-sm text-gray-500 mt-1">Fale com a administradora</p>
      </div>
      <ChatCliente conversaId={conversa.id} />
    </div>
  )
}
