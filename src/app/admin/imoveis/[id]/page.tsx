import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImovelEditForm } from '@/components/imoveis/imovel-edit-form'
import { FotoUpload } from '@/components/imoveis/foto-upload'
import { DespesasImovel } from '@/components/imoveis/despesas-imovel'
import { formatCurrency, statusImovelLabel, statusImovelColor, tipoImovelLabel } from '@/lib/utils'
import { MapPin, Home, Square } from 'lucide-react'

export default async function ImovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: imovel } = await supabase
    .from('imoveis')
    .select('*, imovel_fotos(*)')
    .eq('id', id)
    .single()

  if (!imovel) notFound()

  const { data: locacoesAtivas } = await supabase
    .from('locacoes')
    .select('*, profiles(nome, email, telefone)')
    .eq('imovel_id', id)
    .eq('status', 'ativa')

  const { data: proprietarios } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('role', 'proprietario')
    .order('nome')

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/imoveis" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />Voltar
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{imovel.endereco}{imovel.numero ? `, ${imovel.numero}` : ''}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />{imovel.cidade}, {imovel.uf}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusImovelColor(imovel.status)}`}>
            {statusImovelLabel(imovel.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FotoUpload imovelId={imovel.id} fotos={imovel.imovel_fotos ?? []} />

          <Card>
            <CardHeader><CardTitle>Editar Imóvel</CardTitle></CardHeader>
            <CardContent>
              <ImovelEditForm imovel={imovel} proprietarios={proprietarios ?? []} />
            </CardContent>
          </Card>

          <DespesasImovel imovelId={imovel.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className="font-medium">{tipoImovelLabel(imovel.tipo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Aluguel</span>
                <span className="font-bold text-gray-900">{formatCurrency(imovel.valor_aluguel)}</span>
              </div>
              {imovel.valor_condominio ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Condomínio</span>
                  <span className="font-medium">{formatCurrency(imovel.valor_condominio)}</span>
                </div>
              ) : null}
              {imovel.valor_iptu ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IPTU</span>
                  <span className="font-medium">{formatCurrency(imovel.valor_iptu)}</span>
                </div>
              ) : null}
              {imovel.quartos ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Quartos</span>
                  <span className="font-medium">{imovel.quartos}</span>
                </div>
              ) : null}
              {imovel.area ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Área</span>
                  <span className="font-medium">{imovel.area} m²</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {locacoesAtivas && locacoesAtivas.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Locação Ativa</CardTitle></CardHeader>
              {locacoesAtivas.map((loc: any) => (
                <CardContent key={loc.id} className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">{loc.profiles?.nome}</p>
                  <p className="text-xs text-gray-500">{loc.profiles?.email}</p>
                  <p className="text-xs text-gray-500">{loc.profiles?.telefone}</p>
                  <Link href={`/admin/locacoes/${loc.id}`} className="text-xs text-blue-600 hover:underline">
                    Ver locação →
                  </Link>
                </CardContent>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
