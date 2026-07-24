import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProprietarioEditForm } from '@/components/proprietarios/proprietario-edit-form'
import { formatCurrency, getInitials, tipoImovelLabel } from '@/lib/utils'

export default async function ProprietarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: proprietario } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'proprietario')
    .single()
  if (!proprietario) notFound()

  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('id, endereco, numero, cidade, uf, tipo, valor_aluguel, taxa_administracao_pct, status')
    .eq('proprietario_id', id)
    .order('endereco')

  return (
    <div>
      <Link href="/admin/proprietarios" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-lg">
          {getInitials(proprietario.nome)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{proprietario.nome}</h1>
          <p className="text-sm text-gray-500">{proprietario.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Dados do Proprietário</CardTitle></CardHeader>
            <CardContent>
              <ProprietarioEditForm proprietario={proprietario} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Imóveis administrados</CardTitle></CardHeader>
            <div className="divide-y divide-gray-50">
              {!imoveis?.length ? (
                <p className="px-6 py-4 text-sm text-gray-500">
                  Nenhum imóvel vinculado ainda. Vincule este proprietário na ficha de um imóvel.
                </p>
              ) : imoveis.map(imovel => (
                <div key={imovel.id} className="px-6 py-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {imovel.endereco}{imovel.numero ? `, ${imovel.numero}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">{tipoImovelLabel(imovel.tipo)} · {imovel.cidade}/{imovel.uf}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">Aluguel: {formatCurrency(imovel.valor_aluguel)}</p>
                    <span className="text-xs text-amber-700 font-medium">Taxa {Number(imovel.taxa_administracao_pct)}%</span>
                  </div>
                  <Link href={`/admin/imoveis/${imovel.id}`} className="text-xs text-blue-600 hover:underline">Ver imóvel →</Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
