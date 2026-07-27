import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserCog, Plus, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { getInitials } from '@/lib/utils'
import type { Profile, FuncionarioPermissao } from '@/lib/types'

type FuncionarioComPermissoes = Profile & { funcionario_permissoes: Pick<FuncionarioPermissao, 'secao'>[] }

export default async function FuncionariosPage() {
  const supabase = await createClient()
  const { data: funcionarios } = await supabase
    .from('profiles')
    .select('*, funcionario_permissoes(secao)')
    .eq('role', 'funcionario')
    .order('nome')

  return (
    <div>
      <PageHeader
        title="Funcionários"
        description={`${funcionarios?.length ?? 0} funcionários cadastrados`}
        action={
          <Link href="/admin/funcionarios/novo">
            <Button><Plus className="h-4 w-4" />Novo Funcionário</Button>
          </Link>
        }
      />
      {!funcionarios?.length ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum funcionário cadastrado"
          description="Cadastre funcionários da sua equipe com login próprio e escolha o que cada um pode ver e editar."
          action={
            <Link href="/admin/funcionarios/novo">
              <Button><Plus className="h-4 w-4" />Cadastrar funcionário</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(funcionarios as FuncionarioComPermissoes[]).map((f) => (
            <Link key={f.id} href={`/admin/funcionarios/${f.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm shrink-0">
                      {getInitials(f.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{f.nome}</p>
                        {!f.ativo && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 shrink-0">Inativo</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />{f.email}
                      </p>
                      {f.telefone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />{f.telefone}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-blue-700 font-medium">
                        {f.funcionario_permissoes?.length ?? 0} aba(s) liberada(s)
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
