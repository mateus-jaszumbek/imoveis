import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCards } from '@/components/financeiro/kpi-cards'
import { TendenciaMensalChart } from '@/components/financeiro/tendencia-mensal-chart'
import { TipoImovelChart } from '@/components/financeiro/tipo-imovel-chart'
import { RankingImoveis } from '@/components/financeiro/ranking-imoveis'
import { RegiaoRanking } from '@/components/financeiro/regiao-ranking'
import { aggregarPorMes, aggregarPorImovel, aggregarPorTipo, aggregarPorRegiao } from '@/lib/financeiro'
import type { BoletoFinanceiro, DespesaFinanceira } from '@/lib/financeiro'

function inicioMesISO(offsetMeses = 0): string {
  const hoje = new Date()
  const d = new Date(hoje.getFullYear(), hoje.getMonth() + offsetMeses, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default async function FinanceiroPage() {
  const supabase = await createClient()

  const cutoff = inicioMesISO(-24)
  const inicioMesAtual = inicioMesISO(0)
  const inicioProxMes = inicioMesISO(1)

  const [{ data: boletosPagos }, { data: despesas }, { data: boletosMesAtual }] = await Promise.all([
    supabase
      .from('boletos')
      .select('id, valor, pago_em, locacoes(imoveis(id, codigo, endereco, tipo, bairro, cidade, uf))')
      .eq('status', 'pago')
      .gte('pago_em', cutoff),
    supabase
      .from('despesas')
      .select('id, valor, data, imovel_id, imoveis(id, codigo, endereco, tipo, bairro, cidade, uf)')
      .gte('data', cutoff),
    supabase
      .from('boletos')
      .select('status')
      .gte('vencimento', inicioMesAtual)
      .lt('vencimento', inicioProxMes),
  ])

  const boletos = (boletosPagos ?? []) as unknown as BoletoFinanceiro[]
  const despesasFinanceiras = (despesas ?? []) as unknown as DespesaFinanceira[]

  const tendenciaMensal = aggregarPorMes(boletos, despesasFinanceiras, 12)
  const mesAtual = tendenciaMensal[tendenciaMensal.length - 1]

  const imoveisAgregados = aggregarPorImovel(boletos, despesasFinanceiras)
  const porTipo = aggregarPorTipo(imoveisAgregados)
  const porRegiao = aggregarPorRegiao(imoveisAgregados)

  const totalBoletosMes = boletosMesAtual?.length ?? 0
  const vencidosMes = boletosMesAtual?.filter(b => b.status === 'vencido').length ?? 0
  const taxaInadimplencia = totalBoletosMes > 0 ? (vencidosMes / totalBoletosMes) * 100 : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="mt-1 text-sm text-gray-500">Faturamento, despesas e retorno por imóvel, tipo e região</p>
      </div>

      <KpiCards
        faturamentoMes={mesAtual.faturamento}
        despesasMes={mesAtual.despesas}
        lucroMes={mesAtual.lucro}
        boletosRecebidosMes={mesAtual.qtdBoletos}
        taxaInadimplencia={taxaInadimplencia}
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>Faturamento, despesas e lucro — últimos 12 meses</CardTitle></CardHeader>
        <div className="px-2 py-4">
          <TendenciaMensalChart dados={tendenciaMensal} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle>Imóveis mais lucrativos</CardTitle></CardHeader>
          <RankingImoveis imoveis={imoveisAgregados} />
        </Card>

        <Card>
          <CardHeader><CardTitle>Retorno por região</CardTitle></CardHeader>
          <RegiaoRanking regioes={porRegiao} />
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Lucro por tipo de imóvel</CardTitle></CardHeader>
        <div className="px-2 py-4">
          <TipoImovelChart dados={porTipo} />
        </div>
      </Card>
    </div>
  )
}
