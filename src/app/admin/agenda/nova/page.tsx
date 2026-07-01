import { createClient } from '@/lib/supabase/server'
import { AgendamentoForm } from '@/components/agenda/agendamento-form'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NovoAgendamentoPage() {
  const supabase = await createClient()
  const [{ data: imoveis }, { data: locacoes }] = await Promise.all([
    supabase.from('imoveis').select('id, endereco, numero, cidade').order('endereco'),
    supabase
      .from('locacoes')
      .select('id, imovel_id, imoveis(endereco, numero, cidade), profiles(nome)')
      .eq('status', 'ativa')
      .order('criado_em', { ascending: false }),
  ])

  return (
    <div>
      <Link href="/admin/agenda" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>
      <PageHeader title="Novo Agendamento" description="Agende uma visita ou entrega/retirada de chaves" />
      <AgendamentoForm imoveis={imoveis ?? []} locacoes={(locacoes as any) ?? []} />
    </div>
  )
}
