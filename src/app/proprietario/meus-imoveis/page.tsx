import { createClient } from '@/lib/supabase/server'
import { Building2, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, statusImovelLabel, statusImovelColor, tipoImovelLabel } from '@/lib/utils'
import type { Imovel } from '@/lib/types'

type ImovelComLocacoes = Imovel & { locacoes: { status: string; valor: number; profiles: { nome: string } }[] }

export default async function MeusImoveisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('*, locacoes(status, valor, profiles(nome))')
    .eq('proprietario_id', user!.id)
    .order('endereco')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meus Imóveis</h1>
        <p className="mt-1 text-sm text-gray-500">Imóveis administrados por esta imobiliária em seu nome</p>
      </div>

      {!imoveis?.length ? (
        <EmptyState icon={Building2} title="Nenhum imóvel vinculado" description="Assim que a imobiliária vincular um imóvel a você, ele aparece aqui." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(imoveis as ImovelComLocacoes[]).map((imovel) => {
            const locacaoAtiva = imovel.locacoes?.find((l) => l.status === 'ativa')
            return (
              <Card key={imovel.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{imovel.endereco}{imovel.numero ? `, ${imovel.numero}` : ''}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />{imovel.cidade}, {imovel.uf}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${statusImovelColor(imovel.status)}`}>
                      {statusImovelLabel(imovel.status)}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 mt-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tipo</span>
                      <span className="font-medium">{tipoImovelLabel(imovel.tipo)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Aluguel</span>
                      <span className="font-bold text-gray-900">{formatCurrency(imovel.valor_aluguel)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Taxa de administração</span>
                      <span className="font-medium">{Number(imovel.taxa_administracao_pct)}%</span>
                    </div>
                    {locacaoAtiva && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Inquilino atual</span>
                        <span className="font-medium">{locacaoAtiva.profiles?.nome}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
