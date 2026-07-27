import { createClient } from '@/lib/supabase/server'
import { CalendarDays, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { SePodeEditar } from '@/components/layout/se-pode-editar'
import { AgendaLista } from '@/components/agenda/agenda-lista'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('*, imoveis(endereco, numero, cidade, uf), locacoes(id, profiles(nome, telefone))')
    .order('data_hora', { ascending: true })

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Visitas e entrega/retirada de chaves"
        action={
          <SePodeEditar secao="agenda">
            <Link href="/admin/agenda/nova">
              <Button><Plus className="h-4 w-4" />Novo Agendamento</Button>
            </Link>
          </SePodeEditar>
        }
      />
      {!agendamentos?.length ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum agendamento"
          description="Agende visitas a imóveis ou entrega/retirada de chaves."
          action={
            <SePodeEditar secao="agenda">
              <Link href="/admin/agenda/nova">
                <Button><Plus className="h-4 w-4" />Novo Agendamento</Button>
              </Link>
            </SePodeEditar>
          }
        />
      ) : (
        <AgendaLista agendamentos={agendamentos as any} />
      )}
    </div>
  )
}
