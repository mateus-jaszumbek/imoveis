'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, categoriaDespesaLabel, parseMoeda } from '@/lib/utils'
import { Plus, Trash2, Wallet } from 'lucide-react'
import type { Despesa } from '@/lib/types'

const CATEGORIAS = [
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'comissao', label: 'Comissão' },
  { value: 'imposto', label: 'Imposto' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'administracao', label: 'Administração' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'outro', label: 'Outro' },
]

export function DespesasImovel({ imovelId }: { imovelId: string }) {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const hoje = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    categoria: 'manutencao',
    descricao: '',
    valor: '',
    data: hoje,
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  useEffect(() => {
    supabase.from('despesas').select('*').eq('imovel_id', imovelId).order('data', { ascending: false })
      .then(({ data }) => { if (data) setDespesas(data as Despesa[]) })
  }, [imovelId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('despesas').insert({
      imovel_id: imovelId,
      categoria: form.categoria as Despesa['categoria'],
      descricao: form.descricao || null,
      valor: parseMoeda(form.valor) ?? 0,
      data: form.data,
    }).select().single()
    setLoading(false)
    if (error) { toast('Erro: ' + error.message, 'error'); return }
    if (data) setDespesas(prev => [data as Despesa, ...prev].sort((a, b) => b.data.localeCompare(a.data)))
    toast('Despesa cadastrada!', 'success')
    setShowModal(false)
    setForm({ categoria: 'manutencao', descricao: '', valor: '', data: hoje })
  }

  async function handleDelete(id: string) {
    await supabase.from('despesas').delete().eq('id', id)
    setDespesas(prev => prev.filter(d => d.id !== id))
    toast('Despesa removida', 'success')
  }

  const total = despesas.reduce((acc, d) => acc + Number(d.valor), 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Despesas</CardTitle>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />Nova Despesa
            </Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-gray-50">
          {!despesas.length ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Nenhuma despesa cadastrada</p>
          ) : (
            <>
              {despesas.map(despesa => (
                <div key={despesa.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-start gap-3">
                    <Wallet className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{categoriaDespesaLabel(despesa.categoria)}</p>
                      {despesa.descricao && <p className="text-xs text-gray-500">{despesa.descricao}</p>}
                      <p className="text-xs text-gray-400">{formatDate(despesa.data)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-bold text-gray-900">{formatCurrency(despesa.valor)}</p>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(despesa.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(total)}</p>
              </div>
            </>
          )}
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Despesa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select id="categoria" label="Categoria *" hint="Classifica o gasto (ex: manutenção, IPTU, condomínio) para os relatórios e gráficos do módulo Financeiro." options={CATEGORIAS} value={form.categoria} onChange={set('categoria')} required />
          <Input id="data" label="Data *" type="date" value={form.data} onChange={set('data')} required />
          <Input id="valor" label="Valor (R$) *" type="text" inputMode="decimal" placeholder="350,00" value={form.valor} onChange={set('valor')} required />
          <Input id="descricao" label="Descrição" value={form.descricao} onChange={set('descricao')} placeholder="Ex: reparo hidráulico" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Cadastrar</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
