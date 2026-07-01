'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function DocumentoDownloadButton({ storagePath }: { storagePath: string }) {
  const supabase = createClient()

  async function handleDownload() {
    const { data } = await supabase.storage.from('documentos').createSignedUrl(storagePath, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <Button size="sm" variant="outline" onClick={handleDownload}>
      <Download className="h-4 w-4" />Baixar
    </Button>
  )
}
