import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Plus, MapPin, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, statusImovelLabel, statusImovelColor, tipoImovelLabel } from '@/lib/utils'

export default async function ImoveisPage() {
  const supabase = await createClient()
  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('*, imovel_fotos(url, ordem)')
    .order('criado_em', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Imóveis"
        description={`${imoveis?.length ?? 0} imóveis cadastrados`}
        action={
          <Link href="/admin/imoveis/novo">
            <Button><Plus className="h-4 w-4" />Novo Imóvel</Button>
          </Link>
        }
      />
      {!imoveis?.length ? (
        <EmptyState
          icon={Building2}
          title="Nenhum imóvel cadastrado"
          description="Cadastre o primeiro imóvel para começar."
          action={
            <Link href="/admin/imoveis/novo">
              <Button><Plus className="h-4 w-4" />Cadastrar imóvel</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {imoveis.map((imovel: any) => {
            const foto = imovel.imovel_fotos?.sort((a: any, b: any) => a.ordem - b.ordem)[0]
            return (
              <Link key={imovel.id} href={`/admin/imoveis/${imovel.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="h-40 bg-gray-100 relative">
                    {foto ? (
                      <img src={foto.url} alt={imovel.endereco} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusImovelColor(imovel.status)}`}>
                        {statusImovelLabel(imovel.status)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-gray-900 truncate">{imovel.endereco}{imovel.numero ? `, ${imovel.numero}` : ''}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />{imovel.cidade}, {imovel.uf}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">{tipoImovelLabel(imovel.tipo)}</p>
                        <p className="text-base font-bold text-gray-900">{formatCurrency(imovel.valor_aluguel)}<span className="text-xs font-normal text-gray-500">/mês</span></p>
                      </div>
                      {imovel.quartos && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Home className="h-3 w-3" />{imovel.quartos} quartos
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
