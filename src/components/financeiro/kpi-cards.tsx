import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, TrendingDown, TrendingUp, Receipt, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface KpiCardsProps {
  faturamentoMes: number
  despesasMes: number
  lucroMes: number
  boletosRecebidosMes: number
  taxaInadimplencia: number
}

export function KpiCards({ faturamentoMes, despesasMes, lucroMes, boletosRecebidosMes, taxaInadimplencia }: KpiCardsProps) {
  const cards = [
    { label: 'Faturamento do mês', value: formatCurrency(faturamentoMes), icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
    { label: 'Despesas do mês', value: formatCurrency(despesasMes), icon: TrendingDown, color: 'text-red-600 bg-red-50' },
    { label: 'Lucro líquido do mês', value: formatCurrency(lucroMes), icon: TrendingUp, color: lucroMes >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50' },
    { label: 'Boletos recebidos no mês', value: String(boletosRecebidosMes), icon: Receipt, color: 'text-purple-600 bg-purple-50' },
    { label: 'Taxa de inadimplência', value: `${taxaInadimplencia.toFixed(1)}%`, icon: AlertTriangle, color: taxaInadimplencia > 10 ? 'text-red-600 bg-red-50' : 'text-yellow-600 bg-yellow-50' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
