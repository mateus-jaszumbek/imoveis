'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Upload, FileText, Trash2, Download } from 'lucide-react'
import { usePermissoes } from '@/components/providers/permissoes-provider'
import { tipoDocumentoLabel, formatDate } from '@/lib/utils'
import type { Documento } from '@/lib/types'

interface DocumentoUploadProps {
  locacaoId: string
  title?: string
  tipos?: string[]
}

const todosTipos = ['contrato', 'vistoria_entrada', 'vistoria_saida', 'entrega_chaves', 'rg', 'cpf', 'comprovante_renda', 'extrato', 'apólice', 'outro']

export function DocumentoUpload({ locacaoId, title = 'Documentos', tipos }: DocumentoUploadProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [tipoSelecionado, setTipoSelecionado] = useState('contrato')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { toast } = useToast()
  const { podeEditar } = usePermissoes()

  const tiposDisponiveis = tipos ?? todosTipos
  const tipoOptions = tiposDisponiveis.map(t => ({ value: t, label: tipoDocumentoLabel(t) }))

  useEffect(() => {
    supabase.from('documentos').select('*').eq('locacao_id', locacaoId).order('criado_em', { ascending: false })
      .then(({ data }) => { if (data) setDocumentos(data) })
  }, [locacaoId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast('Arquivo muito grande (máx 20MB)', 'error'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${locacaoId}/${tipoSelecionado}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('documentos').upload(path, file)
    if (uploadError) { toast('Erro no upload: ' + uploadError.message, 'error'); setUploading(false); return }
    await supabase.storage.from('documentos').createSignedUrl(path, 60 * 60)
    const { data: doc } = await supabase.from('documentos').insert({
      locacao_id: locacaoId,
      tipo: tipoSelecionado as Documento['tipo'],
      nome_arquivo: file.name,
      url: path, // armazenamos o path, não a URL pública
    }).select().single()
    setUploading(false)
    if (doc) setDocumentos(prev => [doc as Documento, ...prev])
    toast('Documento enviado!', 'success')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDownload(doc: Documento) {
    const { data } = await supabase.storage.from('documentos').createSignedUrl(doc.url, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(doc: Documento) {
    await supabase.storage.from('documentos').remove([doc.url])
    await supabase.from('documentos').delete().eq('id', doc.id)
    setDocumentos(prev => prev.filter(d => d.id !== doc.id))
    toast('Documento removido', 'success')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {podeEditar('documentos') && (
          <div className="flex gap-2">
            <div className="flex-1">
              <Select id="tipo" label="" options={tipoOptions} value={tipoSelecionado} onChange={e => setTipoSelecionado(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => fileRef.current?.click()} loading={uploading}>
                <Upload className="h-4 w-4" />Enviar
              </Button>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" className="hidden" onChange={handleUpload} />
            </div>
          </div>
        )}
        <div className="space-y-2">
          {!documentos.length ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum documento enviado</p>
          ) : documentos.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.nome_arquivo}</p>
                  <p className="text-xs text-gray-400">{tipoDocumentoLabel(doc.tipo)} · {formatDate(doc.criado_em)}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {podeEditar('documentos') && (
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
