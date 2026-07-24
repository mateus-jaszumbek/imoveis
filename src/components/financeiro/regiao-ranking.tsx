import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { RegiaoAgregada } from '@/lib/financeiro'

const COR_BOA = '#0ca30c'
const COR_RUIM = '#d03b3b'

function LinhaRegiao({ item, maxAbs }: { item: RegiaoAgregada; maxAbs: number }) {
  const largura = maxAbs > 0 ? Math.max(4, (Math.abs(item.lucro) / maxAbs) * 100) : 0
  const cor = item.lucro >= 0 ? COR_BOA : COR_RUIM
  return (
    <div className="px-6 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-gray-900">{item.cidade}</p>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: cor }}>{formatCurrency(item.lucro)}</p>
          <p className="text-xs text-gray-400">margem {item.margem.toFixed(0)}%</p>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${largura}%`, backgroundColor: cor }} />
      </div>
    </div>
  )
}

export function RegiaoRanking({ regioes }: { regioes: RegiaoAgregada[] }) {
  if (!regioes.length) {
    return <p className="px-6 py-8 text-center text-sm text-gray-400">Sem dados suficientes ainda.</p>
  }

  const melhor = regioes[0]
  const pior = regioes[regioes.length - 1]
  const maxAbs = Math.max(...regioes.map(r => Math.abs(r.lucro)), 1)

  return (
    <div>
      {regioes.length > 1 && (
        <div className="grid grid-cols-2 gap-3 px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
            <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-green-700 font-medium">Melhor retorno</p>
              <p className="text-sm font-bold text-gray-900 truncate">{melhor.cidade}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
            <TrendingDown className="h-4 w-4 text-red-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-red-700 font-medium">Menor retorno</p>
              <p className="text-sm font-bold text-gray-900 truncate">{pior.cidade}</p>
            </div>
          </div>
        </div>
      )}
      <div className="divide-y divide-gray-50">
        {regioes.map(item => <LinhaRegiao key={item.cidade} item={item} maxAbs={maxAbs} />)}
      </div>
    </div>
  )
}
