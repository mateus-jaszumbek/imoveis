import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Home, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { SePodeEditar } from '@/components/layout/se-pode-editar'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function LocacoesPage() {
  const supabase = await createClient()
  const { data: locacoes } = await supabase
    .from('locacoes')
    .select('*, imoveis(endereco, numero, cidade, uf), profiles(nome, email)')
    .order('criado_em', { ascending: false })

  const ativas = locacoes?.filter(l => l.status === 'ativa') ?? []
  const encerradas = locacoes?.filter(l => l.status === 'encerrada') ?? []

  return (
    <div>
      <PageHeader
        title="Locações"
        description={`${ativas.length} ativas · ${encerradas.length} encerradas`}
        action={
          <SePodeEditar secao="locacoes">
            <Link href="/admin/locacoes/nova">
              <Button><Plus className="h-4 w-4" />Nova Locação</Button>
            </Link>
          </SePodeEditar>
        }
      />
      {!locacoes?.length ? (
        <EmptyState icon={Home} title="Nenhuma locação cadastrada" description="Vincule um inquilino a um imóvel para criar uma locação." action={<SePodeEditar secao="locacoes"><Link href="/admin/locacoes/nova"><Button><Plus className="h-4 w-4" />Nova Locação</Button></Link></SePodeEditar>} />
      ) : (
        <div className="space-y-6">
          {ativas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ativas ({ativas.length})</h2>
              <div className="space-y-3">
                {ativas.map((loc: any) => (
                  <Link key={loc.id} href={`/admin/locacoes/${loc.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="py-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{loc.profiles?.nome}</p>
                          <p className="text-sm text-gray-500">{loc.imoveis?.endereco}{loc.imoveis?.numero ? `, ${loc.imoveis.numero}` : ''} · {loc.imoveis?.cidade}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Início: {formatDate(loc.data_inicio)} · Venc. todo dia {loc.dia_vencimento}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(loc.valor)}</p>
                          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">Ativa</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {encerradas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Encerradas ({encerradas.length})</h2>
              <div className="space-y-3">
                {encerradas.map((loc: any) => (
                  <Link key={loc.id} href={`/admin/locacoes/${loc.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-70">
                      <CardContent className="py-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{loc.profiles?.nome}</p>
                          <p className="text-sm text-gray-500">{loc.imoveis?.endereco}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(loc.data_inicio)} — {formatDate(loc.data_fim)}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">Encerrada</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
