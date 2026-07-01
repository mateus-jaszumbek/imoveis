import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Building2, MapPin, CalendarClock, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { formatDatetime, tipoAgendamentoLabel, statusAgendamentoLabel } from '@/lib/utils'

// Página pública (sem login) — o link é compartilhado diretamente com o
// visitante/inquilino via WhatsApp. Usa o client de service role porque
// quem acessa não tem sessão nenhuma; só expõe os campos necessários para
// acompanhamento (nada de observações internas do admin ou dados financeiros).
export default async function AcompanharPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: agendamento } = await supabase
    .from('agendamentos')
    .select('tipo, data_hora, status, nome_contato, imoveis(endereco, numero, bairro, cidade, uf), locacoes(profiles(nome)), locadoras(nome)')
    .eq('id', id)
    .single()

  if (!agendamento) notFound()

  const imovel = (agendamento as any).imoveis
  const nomePessoa = agendamento.nome_contato ?? (agendamento as any).locacoes?.profiles?.nome
  const nomeLocadora = (agendamento as any).locadoras?.nome

  const statusVisual = {
    agendado: { icon: Clock, color: 'text-blue-600 bg-blue-50', ring: 'ring-blue-200' },
    realizado: { icon: CheckCircle2, color: 'text-green-600 bg-green-50', ring: 'ring-green-200' },
    cancelado: { icon: XCircle, color: 'text-gray-500 bg-gray-100', ring: 'ring-gray-200' },
  }[agendamento.status] ?? { icon: Clock, color: 'text-blue-600 bg-blue-50', ring: 'ring-blue-200' }
  const StatusIcon = statusVisual.icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Acompanhamento de Agendamento</h1>
          {nomeLocadora && <p className="mt-1 text-sm text-gray-500">{nomeLocadora}</p>}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div className={`flex flex-col items-center gap-2 rounded-lg p-4 ring-1 ${statusVisual.ring} ${statusVisual.color}`}>
            <StatusIcon className="h-8 w-8" />
            <p className="font-semibold">{statusAgendamentoLabel(agendamento.status)}</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CalendarClock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{tipoAgendamentoLabel(agendamento.tipo)}</p>
                <p className="font-medium text-gray-900">{formatDatetime(agendamento.data_hora)}</p>
              </div>
            </div>
            {imovel && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Imóvel</p>
                  <p className="font-medium text-gray-900">
                    {imovel.endereco}{imovel.numero ? `, ${imovel.numero}` : ''}
                  </p>
                  <p className="text-gray-500">{imovel.bairro ? `${imovel.bairro} — ` : ''}{imovel.cidade}/{imovel.uf}</p>
                </div>
              </div>
            )}
            {nomePessoa && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">Agendado para</p>
                <p className="font-medium text-gray-900">{nomePessoa}</p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Em caso de dúvidas, entre em contato diretamente com a administradora.
        </p>
      </div>
    </div>
  )
}
