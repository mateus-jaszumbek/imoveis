'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Trash2 } from 'lucide-react'

export function ExcluirInquilino({ inquilinoId, temLocacoes }: { inquilinoId: string; temLocacoes: boolean }) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleExcluir() {
    setLoading(true)
    const res = await fetch('/api/admin/excluir-inquilino', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: inquilinoId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast(json.error ?? 'Erro ao excluir', 'error'); return }
    setShowModal(false)
    toast(
      json.acao === 'excluido'
        ? 'Inquilino excluído com sucesso.'
        : 'Dados pessoais removidos. O histórico de locação foi mantido por exigência legal.',
      'success'
    )
    router.push('/admin/inquilinos')
    router.refresh()
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setShowModal(true)}>
        <Trash2 className="h-3.5 w-3.5" />Excluir Inquilino
      </Button>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Excluir dados do inquilino">
        {temLocacoes ? (
          <p className="text-sm text-gray-600 mb-4">
            Este inquilino já teve locação registrada. Por exigência legal (contratos, boletos e
            documentos ficam retidos por prazo mínimo), não é possível apagar o histórico por
            completo. Em vez disso, os <strong>dados pessoais</strong> (nome, e-mail, telefone, CPF)
            serão removidos e o acesso ao painel será bloqueado — atendendo o direito de exclusão da LGPD.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            Este inquilino nunca teve nenhuma locação registrada. A exclusão será <strong>completa e
            definitiva</strong> — não é possível desfazer.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="danger" loading={loading} onClick={handleExcluir}>
            {temLocacoes ? 'Remover dados pessoais' : 'Excluir definitivamente'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
