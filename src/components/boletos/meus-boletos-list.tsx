'use client'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, statusBoletoColor, statusBoletoLabel, formatMesReferencia } from '@/lib/utils'
import { Download, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import type { Boleto } from '@/lib/types'

export function MeusBoletosList({ boletos }: { boletos: Boleto[] }) {
  const supabase = createClient()

  async function handleDownload(boleto: Boleto) {
    if (!boleto.url_pdf) return
    const { data } = await supabase.storage.from('documentos').createSignedUrl(boleto.url_pdf, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const statusIcon = { em_aberto: Clock, pago: CheckCircle, vencido: AlertTriangle }

  // Resumo
  const emAberto = boletos.filter(b => b.status === 'em_aberto')
  const vencidos = boletos.filter(b => b.status === 'vencido')

  return (
    <div className="space-y-4">
      {(emAberto.length > 0 || vencidos.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {emAberto.length > 0 && (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-800">{emAberto.length}</p>
              <p className="text-xs text-yellow-700">Em aberto</p>
            </div>
          )}
          {vencidos.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
              <p className="text-2xl font-bold text-red-800">{vencidos.length}</p>
              <p className="text-xs text-red-700">Vencidos</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {boletos.map(boleto => {
          const Icon = statusIcon[boleto.status] ?? Clock
          return (
            <Card key={boleto.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${boleto.status === 'pago' ? 'text-green-600' : boleto.status === 'vencido' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <div>
                      <p className="font-semibold text-gray-900">{formatMesReferencia(boleto.mes_referencia)}</p>
                      {boleto.descricao && <p className="text-sm text-gray-500">{boleto.descricao}</p>}
                      <p className="text-xs text-gray-400">Venc: {formatDate(boleto.vencimento)}</p>
                      {boleto.pago_em && <p className="text-xs text-green-600">Pago em: {formatDate(boleto.pago_em)}</p>}
                      {boleto.linha_digitavel && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all select-all">
                          {boleto.linha_digitavel}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(boleto.valor)}</p>
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${statusBoletoColor(boleto.status)}`}>
                      {statusBoletoLabel(boleto.status)}
                    </span>
                    {boleto.url_pdf && (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" onClick={() => handleDownload(boleto)}>
                          <Download className="h-3.5 w-3.5" />Baixar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
