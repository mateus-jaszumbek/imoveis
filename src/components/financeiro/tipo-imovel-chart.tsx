'use client'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { TipoAgregado } from '@/lib/financeiro'

const CORES_TIPO: Record<string, string> = {
  apartamento: '#2a78d6',
  casa: '#eb6834',
  comercial: '#1baf7a',
  sala: '#eda100',
  outro: '#e87ba4',
}

function CustomTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as TipoAgregado
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold text-gray-900">{d.tipoLabel}</p>
      <p className="text-gray-600">Faturamento: {formatCurrency(d.faturamento)}</p>
      <p className="text-gray-600">Despesas: {formatCurrency(d.despesas)}</p>
      <p className="font-medium" style={{ color: d.lucro >= 0 ? '#008300' : '#e34948' }}>Lucro: {formatCurrency(d.lucro)}</p>
      <p className="text-gray-500">Margem: {d.margem.toFixed(1)}%</p>
    </div>
  )
}

export function TipoImovelChart({ dados }: { dados: TipoAgregado[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
          <XAxis dataKey="tipoLabel" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#898781' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(v)}
          />
          <Tooltip content={CustomTooltip} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="lucro" name="Lucro" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {dados.map((d) => (
              <Cell key={d.tipo} fill={CORES_TIPO[d.tipo] ?? '#898781'} />
            ))}
            <LabelList dataKey="lucro" position="top" formatter={(v) => formatCurrency(Number(v))} style={{ fontSize: 11, fill: '#52514e' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
