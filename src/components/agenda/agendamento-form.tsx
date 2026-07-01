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

interface ImovelOpt { id: string; endereco: string; numero: string | null; cidade: string }
interface LocacaoOpt {
  id: string
  imovel_id: string
  imoveis: { endereco: string; numero: string | null; cidade: string } | null
  profiles: { nome: string } | null
}

const tipoOptions = [
  { value: 'visita', label: 'Visita ao imóvel' },
  { value: 'entrega_chaves', label: 'Entrega de chaves' },
  { value: 'retirada_chaves', label: 'Retirada de chaves' },
]

export function AgendamentoForm({ imoveis, locacoes }: { imoveis: ImovelOpt[]; locacoes: LocacaoOpt[] }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    tipo: 'visita' as 'visita' | 'entrega_chaves' | 'retirada_chaves',
    imovel_id: '',
    locacao_id: '',
    nome_contato: '',
    telefone_contato: '',
    email_contato: '',
    data_hora: '',
    observacoes: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const isVisita = form.tipo === 'visita'

  const imovelOptions = imoveis.map(i => ({ value: i.id, label: `${i.endereco}${i.numero ? `, ${i.numero}` : ''} — ${i.cidade}` }))
  const locacaoOptions = locacoes.map(l => ({
    value: l.id,
    label: `${l.imoveis?.endereco ?? ''}${l.imoveis?.numero ? `, ${l.imoveis.numero}` : ''} — ${l.profiles?.nome ?? ''}`,
  }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.data_hora) { toast('Selecione a data e hora', 'error'); return }

    const data_hora = new Date(form.data_hora).toISOString()
    const observacoes = form.observacoes || null

    let error: { message: string } | null
    if (isVisita) {
      if (!form.imovel_id) { toast('Selecione o imóvel', 'error'); return }
      if (!form.nome_contato) { toast('Informe o nome do visitante', 'error'); return }
      setLoading(true)
      ;({ error } = await supabase.from('agendamentos').insert({
        tipo: 'visita',
        imovel_id: form.imovel_id,
        locacao_id: null,
        nome_contato: form.nome_contato,
        telefone_contato: form.telefone_contato || null,
        email_contato: form.email_contato || null,
        data_hora,
        observacoes,
      }))
    } else {
      if (!form.locacao_id) { toast('Selecione a locação', 'error'); return }
      const locacao = locacoes.find(l => l.id === form.locacao_id)
      if (!locacao) { toast('Locação inválida', 'error'); return }
      setLoading(true)
      ;({ error } = await supabase.from('agendamentos').insert({
        tipo: form.tipo as 'entrega_chaves' | 'retirada_chaves',
        imovel_id: locacao.imovel_id,
        locacao_id: form.locacao_id,
        data_hora,
        observacoes,
      }))
    }
    setLoading(false)
    if (error) { toast('Erro ao agendar: ' + error.message, 'error'); return }
    toast('Agendamento criado!', 'success')
    router.push('/admin/agenda')
    router.refresh()
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Select id="tipo" label="Tipo de agendamento *" options={tipoOptions} value={form.tipo} onChange={set('tipo')} />

          {isVisita ? (
            <>
              <Select
                id="imovel_id"
                label="Imóvel *"
                options={imovelOptions}
                placeholder="Selecione o imóvel..."
                value={form.imovel_id}
                onChange={set('imovel_id')}
              />
              <Input id="nome_contato" label="Nome do visitante *" value={form.nome_contato} onChange={set('nome_contato')} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input id="telefone_contato" label="Telefone" type="tel" value={form.telefone_contato} onChange={set('telefone_contato')} placeholder="(00) 00000-0000" />
                <Input id="email_contato" label="E-mail" type="email" value={form.email_contato} onChange={set('email_contato')} />
              </div>
            </>
          ) : (
            <Select
              id="locacao_id"
              label="Locação *"
              options={locacaoOptions}
              placeholder="Selecione a locação..."
              value={form.locacao_id}
              onChange={set('locacao_id')}
            />
          )}

          <Input id="data_hora" label="Data e hora *" type="datetime-local" value={form.data_hora} onChange={set('data_hora')} required />
          <Textarea id="observacoes" label="Observações" value={form.observacoes} onChange={set('observacoes')} rows={3} />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={loading}>Agendar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
