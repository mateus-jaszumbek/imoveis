'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'

export function EncerrarLocacao({ locacaoId, imovelId }: { locacaoId: string; imovelId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  async function handleEncerrar() {
    setLoading(true)
    const dataFim = new Date().toISOString().split('T')[0]
    await supabase.from('locacoes').update({ status: 'encerrada', data_fim: dataFim }).eq('id', locacaoId)
    await supabase.from('imoveis').update({ status: 'disponivel' }).eq('id', imovelId)
    setLoading(false)
    setShowModal(false)
    toast('Locação encerrada. Imóvel marcado como disponível.', 'success')
    router.push('/admin/locacoes')
    router.refresh()
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setShowModal(true)}>Encerrar Locação</Button>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Encerrar Locação">
        <p className="text-sm text-gray-600 mb-4">
          Tem certeza que deseja encerrar esta locação? O imóvel voltará ao status <strong>disponível</strong>.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="danger" loading={loading} onClick={handleEncerrar}>Encerrar</Button>
        </div>
      </Modal>
    </>
  )
}
