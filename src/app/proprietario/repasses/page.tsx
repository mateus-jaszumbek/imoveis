import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, tipoImovelLabel } from '@/lib/utils'
import { aggregarRepassePorProprietario, aggregarPorImovel } from '@/lib/financeiro'
import type { BoletoFinanceiro, DespesaFinanceira } from '@/lib/financeiro'
import { DollarSign, TrendingDown, Percent, Wallet } from 'lucide-react'

function inicioMesISO(offsetMeses = 0): string {
  const hoje = new Date()
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + offsetMeses, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default async function RepassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cutoff = inicioMesISO(-24)

  const [{ data: boletosPagos }, { data: despesas }] = await Promise.all([
    supabase
      .from('boletos')
      .select('id, valor, pago_em, locacoes(imoveis(id, codigo, endereco, tipo, bairro, cidade, uf, proprietario_id, taxa_administracao_pct))')
      .eq('status', 'pago')
      .gte('pago_em', cutoff),
    supabase
      .from('despesas')
      .select('id, valor, data, imovel_id, imoveis(id, codigo, endereco, tipo, bairro, cidade, uf, proprietario_id, taxa_administracao_pct)')
      .gte('data', cutoff),
  ])

  const boletos = (boletosPagos ?? []) as unknown as BoletoFinanceiro[]
  const despesasFinanceiras = (despesas ?? []) as unknown as DespesaFinanceira[]

  const extratoMensal = aggregarRepassePorProprietario(boletos, despesasFinanceiras, user!.id, 12)
  const mesAtual = extratoMensal[extratoMensal.length - 1]
  const porImovel = aggregarPorImovel(boletos, despesasFinanceiras).filter(i => i.proprietarioId === user!.id)

  const cards = [
    { label: 'Aluguel recebido no mês', value: formatCurrency(mesAtual.aluguelRecebido), icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
    { label: 'Despesas do mês', value: formatCurrency(mesAtual.despesas), icon: TrendingDown, color: 'text-red-600 bg-red-50' },
    { label: 'Comissão da imobiliária', value: formatCurrency(mesAtual.comissao), icon: Percent, color: 'text-gray-600 bg-gray-100' },
    { label: 'Repasse líquido do mês', value: formatCurrency(mesAtual.repasseLiquido), icon: Wallet, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Repasses</h1>
        <p className="mt-1 text-sm text-gray-500">Extrato do que a imobiliária recebe e repassa a você, mês a mês</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Histórico mensal</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Mês</th>
                <th className="px-6 py-3 font-medium text-right">Aluguel recebido</th>
                <th className="px-6 py-3 font-medium text-right">Despesas</th>
                <th className="px-6 py-3 font-medium text-right">Comissão</th>
                <th className="px-6 py-3 font-medium text-right">Repasse líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {extratoMensal.map(m => (
                <tr key={m.mes}>
                  <td className="px-6 py-2.5 font-medium text-gray-900">{m.mesLabel}</td>
                  <td className="px-6 py-2.5 text-right">{formatCurrency(m.aluguelRecebido)}</td>
                  <td className="px-6 py-2.5 text-right text-red-600">{formatCurrency(m.despesas)}</td>
                  <td className="px-6 py-2.5 text-right text-gray-500">{formatCurrency(m.comissao)}</td>
                  <td className="px-6 py-2.5 text-right font-bold text-green-700">{formatCurrency(m.repasseLiquido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Repasse acumulado por imóvel</CardTitle></CardHeader>
        <div className="divide-y divide-gray-50">
          {!porImovel.length ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Sem dados suficientes ainda.</p>
          ) : porImovel.map(item => (
            <div key={item.imovelId} className="flex items-center justify-between px-6 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.endereco}</p>
                <p className="text-xs text-gray-500">{tipoImovelLabel(item.tipo)} · {item.cidade}/{item.uf}</p>
              </div>
              <p className="text-sm font-bold text-green-700">{formatCurrency(item.repasse)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
