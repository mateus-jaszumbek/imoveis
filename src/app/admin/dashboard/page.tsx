import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, Receipt, MessageSquare, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalImoveis },
    { count: locacoesAtivas },
    { count: boletosEmAberto },
    { count: boletosVencidos },
    { data: msgNaoLidas },
  ] = await Promise.all([
    supabase.from('imoveis').select('*', { count: 'exact', head: true }),
    supabase.from('locacoes').select('*', { count: 'exact', head: true }).eq('status', 'ativa'),
    supabase.from('boletos').select('*', { count: 'exact', head: true }).eq('status', 'em_aberto'),
    supabase.from('boletos').select('*', { count: 'exact', head: true }).eq('status', 'vencido'),
    supabase.from('mensagens').select('id').eq('lida', false).eq('autor_role', 'cliente'),
  ])

  const { data: boletosRecentes } = await supabase
    .from('boletos')
    .select('*, locacoes(imoveis(endereco), profiles(nome))')
    .in('status', ['em_aberto', 'vencido'])
    .order('vencimento', { ascending: true })
    .limit(5)

  const cards = [
    { label: 'Total de Imóveis', value: totalImoveis ?? 0, icon: Building2, color: 'text-blue-600 bg-blue-50', href: '/admin/imoveis' },
    { label: 'Locações Ativas', value: locacoesAtivas ?? 0, icon: Users, color: 'text-green-600 bg-green-50', href: '/admin/locacoes' },
    { label: 'Boletos em Aberto', value: boletosEmAberto ?? 0, icon: Receipt, color: 'text-yellow-600 bg-yellow-50', href: '/admin/boletos' },
    { label: 'Boletos Vencidos', value: boletosVencidos ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50', href: '/admin/boletos' },
    { label: 'Msgs não lidas', value: msgNaoLidas?.length ?? 0, icon: MessageSquare, color: 'text-purple-600 bg-purple-50', href: '/admin/mensagens' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Visão geral da locadora</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Boletos pendentes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {!boletosRecentes?.length ? (
            <p className="px-6 py-8 text-center text-sm text-gray-500">Nenhum boleto pendente</p>
          ) : (
            boletosRecentes.map((boleto: any) => (
              <div key={boleto.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{boleto.locacoes?.profiles?.nome ?? '—'}</p>
                  <p className="text-xs text-gray-500">{boleto.locacoes?.imoveis?.endereco ?? '—'} · Venc. {new Date(boleto.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(boleto.valor)}</p>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${boleto.status === 'vencido' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {boleto.status === 'vencido' ? 'Vencido' : 'Em Aberto'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
