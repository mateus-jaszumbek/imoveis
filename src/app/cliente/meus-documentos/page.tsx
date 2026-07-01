import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { tipoDocumentoLabel, formatDate } from '@/lib/utils'
import { DocumentoDownloadButton } from '@/components/documentos/documento-download-button'

export default async function MeusDocumentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: locacao } = await supabase
    .from('locacoes')
    .select('id')
    .eq('inquilino_id', user.id)
    .eq('status', 'ativa')
    .single()

  if (!locacao) {
    return <EmptyState icon={FileText} title="Sem locação ativa" description="Sem documentos para exibir." />
  }

  const { data: documentos } = await supabase
    .from('documentos')
    .select('*')
    .eq('locacao_id', locacao.id)
    .in('tipo', ['contrato', 'vistoria_entrada', 'vistoria_saida', 'entrega_chaves', 'apólice', 'outro'])
    .order('criado_em', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Documentos</h1>
        <p className="text-sm text-gray-500 mt-1">Contratos, vistorias e outros documentos</p>
      </div>
      {!documentos?.length ? (
        <EmptyState icon={FileText} title="Nenhum documento" description="Seus documentos aparecerão aqui quando a administradora enviá-los." />
      ) : (
        <div className="space-y-3">
          {documentos.map((doc: any) => (
            <Card key={doc.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{doc.nome_arquivo}</p>
                    <p className="text-xs text-gray-500">{tipoDocumentoLabel(doc.tipo)} · {formatDate(doc.criado_em)}</p>
                  </div>
                </div>
                <DocumentoDownloadButton storagePath={doc.url} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
