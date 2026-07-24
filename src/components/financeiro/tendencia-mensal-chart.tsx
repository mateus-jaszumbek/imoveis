'use client'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { PontoMensal } from '@/lib/financeiro'

const COR_FATURAMENTO = '#2a78d6'
const COR_DESPESAS = '#e34948'
const COR_LUCRO = '#008300'

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(Number(p.value))}
        </p>
      ))}
    </div>
  )
}

export function TendenciaMensalChart({ dados }: { dados: PontoMensal[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
          <XAxis dataKey="mesLabel" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#898781' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(v)}
          />
          <Tooltip content={CustomTooltip} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#52514e' }} />
          <Bar dataKey="faturamento" name="Faturamento" fill={COR_FATURAMENTO} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="despesas" name="Despesas" fill={COR_DESPESAS} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line type="monotone" dataKey="lucro" name="Lucro líquido" stroke={COR_LUCRO} strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
