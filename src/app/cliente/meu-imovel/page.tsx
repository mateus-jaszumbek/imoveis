import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, MapPin, Home, Square, Calendar, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate, tipoImovelLabel, statusImovelLabel } from '@/lib/utils'

export default async function MeuImovelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: locacao } = await supabase
    .from('locacoes')
    .select('*, imoveis(*, imovel_fotos(url, ordem)), profiles(nome)')
    .eq('inquilino_id', user.id)
    .eq('status', 'ativa')
    .single()

  if (!locacao) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Sem locação ativa</h2>
        <p className="text-sm text-gray-500 mt-1">Entre em contato com a administradora.</p>
      </div>
    )
  }

  const imovel = (locacao as any).imoveis
  const fotos = imovel?.imovel_fotos?.sort((a: any, b: any) => a.ordem - b.ordem) ?? []
  const fotoPrincipal = fotos[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Imóvel</h1>
        <p className="text-sm text-gray-500 mt-1">Informações da sua locação</p>
      </div>

      {fotoPrincipal && (
        <div className="rounded-xl overflow-hidden h-48 bg-gray-100">
          <img src={fotoPrincipal.url} alt={imovel.endereco} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-600" />Endereço</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="font-semibold text-gray-900">{imovel?.endereco}{imovel?.numero ? `, ${imovel.numero}` : ''}</p>
            {imovel?.complemento && <p className="text-sm text-gray-600">{imovel.complemento}</p>}
            <p className="text-sm text-gray-600">{imovel?.bairro ? `${imovel.bairro} — ` : ''}{imovel?.cidade}/{imovel?.uf}</p>
            {imovel?.cep && <p className="text-sm text-gray-500">CEP: {imovel.cep}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="h-4 w-4 text-green-600" />Financeiro</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Aluguel</span>
              <span className="font-bold text-gray-900">{formatCurrency(locacao.valor)}</span>
            </div>
            {imovel?.valor_condominio ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Condomínio</span>
                <span className="font-medium">{formatCurrency(imovel.valor_condominio)}</span>
              </div>
            ) : null}
            {imovel?.valor_iptu ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IPTU</span>
                <span className="font-medium">{formatCurrency(imovel.valor_iptu)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm pt-1 border-t border-gray-100">
              <span className="text-gray-500">Vencimento</span>
              <span className="font-semibold">Todo dia {locacao.dia_vencimento}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4 text-purple-600" />Contrato</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Início</span>
              <span className="font-medium">{formatDate(locacao.data_inicio)}</span>
            </div>
            {locacao.data_fim && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Término</span>
                <span className="font-medium">{formatDate(locacao.data_fim)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">Ativa</span>
            </div>
          </CardContent>
        </Card>

        {imovel && (imovel.tipo || imovel.quartos || imovel.area) && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-4 w-4 text-orange-600" />Características</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {imovel.tipo && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tipo</span>
                  <span className="font-medium">{tipoImovelLabel(imovel.tipo)}</span>
                </div>
              )}
              {imovel.quartos && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Quartos</span>
                  <span className="font-medium">{imovel.quartos}</span>
                </div>
              )}
              {imovel.area && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Área</span>
                  <span className="font-medium">{imovel.area} m²</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
