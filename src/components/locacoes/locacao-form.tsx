'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { parseMoeda } from '@/lib/utils'

interface Props {
  imoveis: { id: string; endereco: string; numero: string | null; cidade: string }[]
  inquilinos: { id: string; nome: string; email: string }[]
}

export function LocacaoForm({ imoveis, inquilinos }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    imovel_id: '',
    inquilino_id: '',
    data_inicio: '',
    data_fim: '',
    dia_vencimento: '5',
    valor: '',
    indice_reajuste: '',
    seguro_corretora: '',
    seguro_apolice: '',
    observacoes: '',
  })
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.imovel_id || !form.inquilino_id) { toast('Selecione o imóvel e o inquilino', 'error'); return }
    setLoading(true)
    const { error } = await supabase.from('locacoes').insert({
      imovel_id: form.imovel_id,
      inquilino_id: form.inquilino_id,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      dia_vencimento: parseInt(form.dia_vencimento),
      valor: parseMoeda(form.valor) ?? 0,
      indice_reajuste: form.indice_reajuste || null,
      seguro_corretora: form.seguro_corretora || null,
      seguro_apolice: form.seguro_apolice || null,
      observacoes: form.observacoes || null,
    })
    // Atualiza status do imóvel para alugado
    if (!error) await supabase.from('imoveis').update({ status: 'alugado' }).eq('id', form.imovel_id)
    setLoading(false)
    if (error) {
      const mensagem = error.code === '23505'
        ? 'Este inquilino já possui uma locação ativa. Encerre a locação atual dele antes de criar uma nova.'
        : 'Erro: ' + error.message
      toast(mensagem, 'error')
      return
    }
    toast('Locação criada com sucesso!', 'success')
    router.push('/admin/locacoes')
    router.refresh()
  }

  const imovelOptions = imoveis.map(i => ({ value: i.id, label: `${i.endereco}${i.numero ? `, ${i.numero}` : ''} — ${i.cidade}` }))
  const inquilinoOptions = inquilinos.map(i => ({ value: i.id, label: `${i.nome} (${i.email})` }))
  const diasOptions = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `Dia ${i + 1}` }))

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Select id="imovel" label="Imóvel *" options={imovelOptions} placeholder="Selecione o imóvel..." value={form.imovel_id} onChange={set('imovel_id')} />
          <Select id="inquilino" label="Inquilino *" options={inquilinoOptions} placeholder="Selecione o inquilino..." value={form.inquilino_id} onChange={set('inquilino_id')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="data_inicio" label="Data de Início *" type="date" value={form.data_inicio} onChange={set('data_inicio')} required />
            <Input id="data_fim" label="Data de Fim" type="date" value={form.data_fim} onChange={set('data_fim')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="valor" label="Valor do Aluguel (R$) *" type="text" inputMode="decimal" placeholder="1500,00" value={form.valor} onChange={set('valor')} required />
            <Select id="dia_vencimento" label="Dia de Vencimento *" hint="Dia do mês em que o boleto do aluguel vence. Os próximos boletos são gerados automaticamente com base nesse dia." options={diasOptions} value={form.dia_vencimento} onChange={set('dia_vencimento')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="seguro_corretora" label="Corretora de Seguro" hint="Opcional, apenas para referência sua caso o contrato tenha seguro-fiança ou incêndio associado." value={form.seguro_corretora} onChange={set('seguro_corretora')} placeholder="Ex: Porto Seguro" />
            <Input id="seguro_apolice" label="Nº da Apólice" value={form.seguro_apolice} onChange={set('seguro_apolice')} />
          </div>
          <Select
            id="indice_reajuste"
            label="Índice de Reajuste"
            hint="Índice usado para reajustar o valor do aluguel automaticamente na renovação do contrato, conforme a lei do inquilinato. Deixe em branco se não quiser reajuste automático."
            options={[
              { value: 'igpm', label: 'IGP-M' },
              { value: 'ipca', label: 'IPCA' },
              { value: 'inpc', label: 'INPC' },
            ]}
            placeholder="Sem reajuste automático"
            value={form.indice_reajuste}
            onChange={set('indice_reajuste')}
          />
          <Textarea id="observacoes" label="Observações" value={form.observacoes} onChange={set('observacoes')} rows={3} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={loading}>Criar Locação</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
