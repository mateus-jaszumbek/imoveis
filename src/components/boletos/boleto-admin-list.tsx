'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, statusBoletoColor, statusBoletoLabel, formatMesReferencia } from '@/lib/utils'
import { CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react'

export function BoletoAdminList({ boletos: initialBoletos }: { boletos: any[] }) {
  const [boletos, setBoletos] = useState(initialBoletos)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  async function updateStatus(id: string, status: 'em_aberto' | 'pago' | 'vencido') {
    const pago_em = status === 'pago' ? new Date().toISOString().split('T')[0] : null
    const { error } = await supabase.from('boletos').update({ status, pago_em }).eq('id', id)
    if (error) { toast('Erro: ' + error.message, 'error'); return }
    setBoletos(prev => prev.map(b => b.id === id ? { ...b, status, pago_em } : b))
    toast('Status atualizado!', 'success')
    router.refresh()
  }

  const statusIcon = { em_aberto: Clock, pago: CheckCircle, vencido: AlertTriangle }

  return (
    <div className="space-y-3">
      {boletos.map((boleto) => {
        const Icon = statusIcon[boleto.status as keyof typeof statusIcon] ?? Clock
        return (
          <Card key={boleto.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 ${boleto.status === 'pago' ? 'text-green-600' : boleto.status === 'vencido' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="font-semibold text-gray-900">{boleto.locacoes?.profiles?.nome ?? '—'}</p>
                    <p className="text-xs text-gray-500">{boleto.locacoes?.imoveis?.endereco}{boleto.locacoes?.imoveis?.numero ? `, ${boleto.locacoes.imoveis.numero}` : ''}</p>
                    <p className="text-sm text-gray-700 mt-1">{formatMesReferencia(boleto.mes_referencia)}{boleto.descricao ? ` · ${boleto.descricao}` : ''}</p>
                    <p className="text-xs text-gray-400">Venc: {formatDate(boleto.vencimento)}{boleto.pago_em ? ` · Pago: ${formatDate(boleto.pago_em)}` : ''}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 text-lg">{formatCurrency(boleto.valor)}</p>
                  <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${statusBoletoColor(boleto.status)}`}>
                    {statusBoletoLabel(boleto.status)}
                  </span>
                  <div className="flex gap-2 mt-2 justify-end">
                    {boleto.status !== 'pago' && (
                      <Button size="sm" variant="success" onClick={() => updateStatus(boleto.id, 'pago')}>
                        <CheckCircle className="h-3 w-3" />Pago
                      </Button>
                    )}
                    {boleto.status === 'pago' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(boleto.id, 'em_aberto')}>
                        Reabrir
                      </Button>
                    )}
                    {boleto.url_pdf && (
                      <a href={boleto.url_pdf} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline"><Download className="h-3 w-3" /></Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
