import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Plus, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { getInitials } from '@/lib/utils'

export default async function InquilinosPage() {
  const supabase = await createClient()
  const { data: inquilinos } = await supabase
    .from('profiles')
    .select('*, locacoes(id, status, imoveis(endereco, numero))')
    .eq('role', 'cliente')
    .order('nome')

  return (
    <div>
      <PageHeader
        title="Inquilinos"
        description={`${inquilinos?.length ?? 0} inquilinos cadastrados`}
        action={
          <Link href="/admin/inquilinos/novo">
            <Button><Plus className="h-4 w-4" />Novo Inquilino</Button>
          </Link>
        }
      />
      {!inquilinos?.length ? (
        <EmptyState
          icon={Users}
          title="Nenhum inquilino cadastrado"
          description="Cadastre inquilinos para vinculá-los a imóveis."
          action={
            <Link href="/admin/inquilinos/novo">
              <Button><Plus className="h-4 w-4" />Cadastrar inquilino</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inquilinos.map((inq: any) => {
            const locacaoAtiva = inq.locacoes?.find((l: any) => l.status === 'ativa')
            return (
              <Link key={inq.id} href={`/admin/inquilinos/${inq.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm shrink-0">
                        {getInitials(inq.nome)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{inq.nome}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" />{inq.email}
                        </p>
                        {inq.telefone && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />{inq.telefone}
                          </p>
                        )}
                        {locacaoAtiva && (
                          <p className="mt-2 text-xs text-blue-600 font-medium truncate">
                            {locacaoAtiva.imoveis?.endereco}{locacaoAtiva.imoveis?.numero ? `, ${locacaoAtiva.imoveis.numero}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
