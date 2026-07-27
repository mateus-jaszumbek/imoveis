import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Landmark, Plus, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { SePodeEditar } from '@/components/layout/se-pode-editar'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types'

type ProprietarioComImoveis = Profile & { imoveis: { id: string; endereco: string; numero: string | null }[] }

export default async function ProprietariosPage() {
  const supabase = await createClient()
  const { data: proprietarios } = await supabase
    .from('profiles')
    .select('*, imoveis(id, endereco, numero)')
    .eq('role', 'proprietario')
    .order('nome')

  return (
    <div>
      <PageHeader
        title="Proprietários"
        description={`${proprietarios?.length ?? 0} proprietários cadastrados`}
        action={
          <SePodeEditar secao="proprietarios">
            <Link href="/admin/proprietarios/novo">
              <Button><Plus className="h-4 w-4" />Novo Proprietário</Button>
            </Link>
          </SePodeEditar>
        }
      />
      {!proprietarios?.length ? (
        <EmptyState
          icon={Landmark}
          title="Nenhum proprietário cadastrado"
          description="Cadastre proprietários para vincular imóveis administrados por terceiros e calcular o repasse automaticamente."
          action={
            <SePodeEditar secao="proprietarios">
              <Link href="/admin/proprietarios/novo">
                <Button><Plus className="h-4 w-4" />Cadastrar proprietário</Button>
              </Link>
            </SePodeEditar>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(proprietarios as ProprietarioComImoveis[]).map((prop) => (
            <Link key={prop.id} href={`/admin/proprietarios/${prop.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-sm shrink-0">
                      {getInitials(prop.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{prop.nome}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />{prop.email}
                      </p>
                      {prop.telefone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />{prop.telefone}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-amber-700 font-medium">
                        {prop.imoveis?.length ?? 0} imóvel(is) vinculado(s)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
