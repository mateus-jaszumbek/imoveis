import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, tipoDocumentoLabel } from '@/lib/utils'
import { Download } from 'lucide-react'
import { DocumentoDownloadButton } from '@/components/documentos/documento-download-button'

export default async function DocumentosPage() {
  const supabase = await createClient()
  const { data: documentos } = await supabase
    .from('documentos')
    .select('*, locacoes(imoveis(endereco, numero), profiles(nome))')
    .order('criado_em', { ascending: false })

  return (
    <div>
      <PageHeader title="Documentos" description="Todos os documentos enviados" />
      {!documentos?.length ? (
        <EmptyState icon={FileText} title="Nenhum documento" description="Envie documentos nas páginas de locação ou inquilino." />
      ) : (
        <div className="space-y-3">
          {documentos.map((doc: any) => (
            <Card key={doc.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{doc.nome_arquivo}</p>
                    <p className="text-xs text-gray-500">{tipoDocumentoLabel(doc.tipo)} · {doc.locacoes?.profiles?.nome ?? '—'}</p>
                    <p className="text-xs text-gray-400">{doc.locacoes?.imoveis?.endereco} · {formatDate(doc.criado_em)}</p>
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
