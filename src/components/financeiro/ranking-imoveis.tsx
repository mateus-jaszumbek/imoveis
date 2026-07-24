import Link from 'next/link'
import { formatCurrency, tipoImovelLabel } from '@/lib/utils'
import type { ImovelAgregado } from '@/lib/financeiro'

const COR_BOA = '#0ca30c'
const COR_RUIM = '#d03b3b'

function LinhaRanking({ item, maxAbs }: { item: ImovelAgregado; maxAbs: number }) {
  const largura = maxAbs > 0 ? Math.max(4, (Math.abs(item.lucro) / maxAbs) * 100) : 0
  const cor = item.lucro >= 0 ? COR_BOA : COR_RUIM
  return (
    <Link href={`/admin/imoveis/${item.imovelId}`} className="block px-6 py-3 hover:bg-gray-50">
      <div className="flex items-center justify-between mb-1.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.endereco}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            {tipoImovelLabel(item.tipo)} · {item.cidade}/{item.uf}
            {!item.ehProprio && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">de terceiro</span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="text-sm font-bold" style={{ color: cor }}>{formatCurrency(item.lucro)}</p>
          {!item.ehProprio && <p className="text-[11px] text-gray-400">comissão</p>}
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${largura}%`, backgroundColor: cor }} />
      </div>
      {item.repasse != null && (
        <p className="mt-1.5 text-xs text-gray-500">Repasse ao proprietário: <span className="font-medium text-gray-700">{formatCurrency(item.repasse)}</span></p>
      )}
    </Link>
  )
}

export function RankingImoveis({ imoveis }: { imoveis: ImovelAgregado[] }) {
  if (!imoveis.length) {
    return <p className="px-6 py-8 text-center text-sm text-gray-400">Sem dados suficientes ainda — cadastre boletos pagos e despesas para ver o ranking.</p>
  }

  const top = imoveis.slice(0, 5)
  const piores = imoveis.length > 5 ? imoveis.slice(-3).reverse().filter(i => !top.includes(i)) : []
  const maxAbs = Math.max(...imoveis.map(i => Math.abs(i.lucro)), 1)

  return (
    <div>
      <div className="divide-y divide-gray-50">
        {top.map(item => <LinhaRanking key={item.imovelId} item={item} maxAbs={maxAbs} />)}
      </div>
      {piores.length > 0 && (
        <>
          <p className="px-6 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Atenção — menor retorno</p>
          <div className="divide-y divide-gray-50">
            {piores.map(item => <LinhaRanking key={item.imovelId} item={item} maxAbs={maxAbs} />)}
          </div>
        </>
      )}
    </div>
  )
}
