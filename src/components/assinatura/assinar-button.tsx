'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { CreditCard } from 'lucide-react'

export function AssinarButton({ temCpf }: { temCpf: boolean }) {
  const { toast } = useToast()
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAssinar() {
    if (!temCpf && !cpfCnpj.trim()) {
      toast('Informe o CPF ou CNPJ para gerar a cobrança', 'error')
      return
    }
    setLoading(true)
    const res = await fetch('/api/admin/assinar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpfCnpj }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast(json.error ?? 'Erro ao iniciar assinatura', 'error'); return }
    window.location.href = json.invoiceUrl
  }

  return (
    <div className="space-y-3">
      {!temCpf && (
        <Input
          id="cpfCnpj"
          label="CPF ou CNPJ *"
          value={cpfCnpj}
          onChange={e => setCpfCnpj(e.target.value)}
          placeholder="000.000.000-00"
        />
      )}
      <Button onClick={handleAssinar} loading={loading} size="lg" className="w-full">
        <CreditCard className="h-4 w-4" />Assinar agora — R$ 150,00/mês
      </Button>
    </div>
  )
}
