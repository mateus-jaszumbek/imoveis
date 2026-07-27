'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Upload, Trash2, ImageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePermissoes } from '@/components/providers/permissoes-provider'
import type { ImovelFoto } from '@/lib/types'

interface FotoUploadProps {
  imovelId: string
  fotos: ImovelFoto[]
}

export function FotoUpload({ imovelId, fotos: initialFotos }: FotoUploadProps) {
  const [fotos, setFotos] = useState<ImovelFoto[]>(initialFotos.sort((a, b) => a.ordem - b.ordem))
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()
  const { podeEditar } = usePermissoes()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { toast('Arquivo muito grande (máx 10MB)', 'error'); continue }
      const ext = file.name.split('.').pop()
      const path = `${imovelId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('imovel-fotos').upload(path, file)
      if (uploadError) { toast('Erro no upload: ' + uploadError.message, 'error'); continue }
      const { data: { publicUrl } } = supabase.storage.from('imovel-fotos').getPublicUrl(path)
      const { data: nova } = await supabase.from('imovel_fotos').insert({
        imovel_id: imovelId, url: publicUrl, nome_arquivo: file.name, ordem: fotos.length,
      }).select().single()
      if (nova) setFotos(prev => [...prev, nova as ImovelFoto])
    }
    setUploading(false)
    toast('Fotos enviadas!', 'success')
    router.refresh()
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(foto: ImovelFoto) {
    const url = new URL(foto.url)
    const path = url.pathname.split('/imovel-fotos/')[1]
    await supabase.storage.from('imovel-fotos').remove([path])
    await supabase.from('imovel_fotos').delete().eq('id', foto.id)
    setFotos(prev => prev.filter(f => f.id !== foto.id))
    toast('Foto removida', 'success')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fotos do Imóvel</CardTitle>
          {podeEditar('imoveis') && (
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} loading={uploading}>
              <Upload className="h-4 w-4" />Adicionar fotos
            </Button>
          )}
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      </CardHeader>
      <CardContent>
        {!fotos.length ? (
          <div
            className={`flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg transition-colors ${podeEditar('imoveis') ? 'cursor-pointer hover:border-blue-400' : ''}`}
            onClick={() => podeEditar('imoveis') && fileRef.current?.click()}
          >
            <ImageIcon className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">{podeEditar('imoveis') ? 'Clique para adicionar fotos' : 'Nenhuma foto cadastrada'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fotos.map((foto) => (
              <div key={foto.id} className="relative group rounded-lg overflow-hidden aspect-video bg-gray-100">
                <img src={foto.url} alt="" className="h-full w-full object-cover" />
                {podeEditar('imoveis') && (
                  <button
                    onClick={() => handleDelete(foto)}
                    className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {podeEditar('imoveis') && (
              <div
                className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg aspect-video cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
