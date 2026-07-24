'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDatetime } from '@/lib/utils'
import { INDICES_LABEL } from '@/lib/indices-economicos'
import { TrendingUp } from 'lucide-react'
import type { Reajuste } from '@/lib/types'

interface Resultado {
  indice: 'igpm' | 'ipca' | 'inpc'
  percentual: number
  valorAnterior: number
  valorNovo: number
}

const INDICE_OPTIONS = [
  { value: 'igpm', label: 'IGP-M' },
  { value: 'ipca', label: 'IPCA' },
  { value: 'inpc', label: 'INPC' },
]

export function ReajusteLocacao({
  locacaoId,
  valorAtual,
  indiceReajuste,
  historico,
}: {
  locacaoId: string
  valorAtual: number
  indiceReajuste: string | null
  historico: Reajuste[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [indice, setIndice] = useState(indiceReajuste ?? '')
  const [salvandoIndice, setSalvandoIndice] = useState(false)
  const [calculando, setCalculando] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  async function handleSalvarIndice() {
    if (!indice) return
    setSalvandoIndice(true)
    const { error } = await supabase.from('locacoes').update({ indice_reajuste: indice }).eq('id', locacaoId)
    setSalvandoIndice(false)
    if (error) { toast('Erro ao salvar índice: ' + error.message, 'error'); return }
    toast('Índice de reajuste definido!', 'success')
    router.refresh()
  }

  async function handleCalcular() {
    setCalculando(true)
    setResultado(null)
    const res = await fetch('/api/admin/calcular-reajuste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locacaoId }),
    })
    const json = await res.json()
    setCalculando(false)
    if (!res.ok) { toast(json.error ?? 'Erro ao calcular reajuste', 'error'); return }
    setResultado(json)
  }

  async function handleAplicar() {
    if (!resultado) return
    setAplicando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: reajusteError } = await supabase.from('reajustes').insert({
      locacao_id: locacaoId,
      indice: resultado.indice,
      percentual_aplicado: resultado.percentual,
      valor_anterior: resultado.valorAnterior,
      valor_novo: resultado.valorNovo,
      criado_por: user?.id,
    })
    if (!reajusteError) {
      await supabase.from('locacoes').update({ valor: resultado.valorNovo }).eq('id', locacaoId)
    }
    setAplicando(false)
    if (reajusteError) { toast('Erro ao aplicar reajuste: ' + reajusteError.message, 'error'); return }
    toast('Reajuste aplicado! Novo valor do aluguel atualizado.', 'success')
    setResultado(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <CardTitle>Reajuste de Contrato</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!indice ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Nenhum índice de reajuste definido para esta locação.</p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select id="indice" label="Índice" options={INDICE_OPTIONS} placeholder="Selecione..." value={indice} onChange={e => setIndice(e.target.value)} />
              </div>
              <Button onClick={handleSalvarIndice} loading={salvandoIndice} disabled={!indice}>Salvar</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Índice do contrato</span>
              <span className="font-medium">{INDICES_LABEL[indice as 'igpm' | 'ipca' | 'inpc']}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Valor atual do aluguel</span>
              <span className="font-bold text-gray-900">{formatCurrency(valorAtual)}</span>
            </div>

            {!resultado ? (
              <Button onClick={handleCalcular} loading={calculando} className="w-full">
                Calcular reajuste automático (últimos 12 meses)
              </Button>
            ) : (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2">
                <p className="text-sm text-blue-900">
                  Variação acumulada de {INDICES_LABEL[resultado.indice]} nos últimos 12 meses: <strong>{resultado.percentual.toFixed(2)}%</strong>
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">Valor atual</span>
                  <span>{formatCurrency(resultado.valorAnterior)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">Novo valor sugerido</span>
                  <span className="font-bold">{formatCurrency(resultado.valorNovo)}</span>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setResultado(null)}>Cancelar</Button>
                  <Button size="sm" loading={aplicando} onClick={handleAplicar}>Aplicar reajuste</Button>
                </div>
              </div>
            )}
          </>
        )}

        {historico.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Histórico de reajustes</p>
            <div className="space-y-2">
              {historico.map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{formatDatetime(r.aplicado_em)} · {INDICES_LABEL[r.indice]} ({r.percentual_aplicado.toFixed(2)}%)</span>
                  <span className="font-medium text-gray-700">{formatCurrency(r.valor_anterior)} → {formatCurrency(r.valor_novo)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
