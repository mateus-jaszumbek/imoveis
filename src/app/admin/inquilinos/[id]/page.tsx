import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InquilinoEditForm } from '@/components/inquilinos/inquilino-edit-form'
import { ExcluirInquilino } from '@/components/inquilinos/excluir-inquilino'
import { DocumentoUpload } from '@/components/documentos/documento-upload'
import { formatDate, getInitials } from '@/lib/utils'

export default async function InquilinoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: inquilino } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'cliente')
    .single()
  if (!inquilino) notFound()

  const { data: locacoes } = await supabase
    .from('locacoes')
    .select('*, imoveis(endereco, numero, cidade, uf)')
    .eq('inquilino_id', id)
    .order('criado_em', { ascending: false })

  const locacaoAtiva = locacoes?.find(l => l.status === 'ativa')

  return (
    <div>
      <Link href="/admin/inquilinos" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
            {getInitials(inquilino.nome)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{inquilino.nome}</h1>
            <p className="text-sm text-gray-500">{inquilino.email}</p>
          </div>
        </div>
        <ExcluirInquilino inquilinoId={inquilino.id} temLocacoes={(locacoes?.length ?? 0) > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Dados do Inquilino</CardTitle></CardHeader>
            <CardContent>
              <InquilinoEditForm inquilino={inquilino} />
            </CardContent>
          </Card>

          {locacaoAtiva && (
            <DocumentoUpload locacaoId={locacaoAtiva.id} title="Documentos do Inquilino" tipos={['rg', 'cpf', 'comprovante_renda', 'extrato', 'outro']} />
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Histórico de Locações</CardTitle></CardHeader>
            <div className="divide-y divide-gray-50">
              {!locacoes?.length ? (
                <p className="px-6 py-4 text-sm text-gray-500">Sem locações</p>
              ) : locacoes.map((loc: any) => (
                <div key={loc.id} className="px-6 py-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {loc.imoveis?.endereco}{loc.imoveis?.numero ? `, ${loc.imoveis.numero}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">{loc.imoveis?.cidade}, {loc.imoveis?.uf}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">Início: {formatDate(loc.data_inicio)}</p>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${loc.status === 'ativa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {loc.status === 'ativa' ? 'Ativa' : 'Encerrada'}
                    </span>
                  </div>
                  <Link href={`/admin/locacoes/${loc.id}`} className="text-xs text-blue-600 hover:underline">Ver locação →</Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
