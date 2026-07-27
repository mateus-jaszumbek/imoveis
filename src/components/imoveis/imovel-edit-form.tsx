'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { usePermissoes } from '@/components/providers/permissoes-provider'
import { parseMoeda, buscarEnderecoPorCep } from '@/lib/utils'
import type { Imovel } from '@/lib/types'

const tipoOptions = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'sala', label: 'Sala' },
  { value: 'outro', label: 'Outro' },
]
const statusOptions = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'alugado', label: 'Alugado' },
]

export function ImovelEditForm({ imovel, proprietarios = [] }: { imovel: Imovel; proprietarios?: { id: string; nome: string }[] }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { podeEditar } = usePermissoes()
  const [loading, setLoading] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [form, setForm] = useState({
    codigo: imovel.codigo ?? '',
    tipo: imovel.tipo,
    endereco: imovel.endereco,
    numero: imovel.numero ?? '',
    complemento: imovel.complemento ?? '',
    bairro: imovel.bairro ?? '',
    cidade: imovel.cidade,
    uf: imovel.uf,
    cep: imovel.cep ?? '',
    valor_aluguel: imovel.valor_aluguel?.toString() ?? '',
    valor_condominio: imovel.valor_condominio?.toString() ?? '',
    valor_iptu: imovel.valor_iptu?.toString() ?? '',
    quartos: imovel.quartos?.toString() ?? '',
    area: imovel.area?.toString() ?? '',
    descricao: imovel.descricao ?? '',
    status: imovel.status,
    proprietario_id: imovel.proprietario_id ?? '',
    taxa_administracao_pct: imovel.taxa_administracao_pct?.toString() ?? '10',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleCepBlur() {
    if (form.cep.replace(/\D/g, '').length !== 8) return
    setBuscandoCep(true)
    const endereco = await buscarEnderecoPorCep(form.cep)
    setBuscandoCep(false)
    if (!endereco) { toast('CEP não encontrado', 'error'); return }
    setForm(prev => ({ ...prev, endereco: endereco.logradouro, bairro: endereco.bairro, cidade: endereco.localidade, uf: endereco.uf }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      valor_aluguel: parseMoeda(form.valor_aluguel),
      valor_condominio: parseMoeda(form.valor_condominio),
      valor_iptu: parseMoeda(form.valor_iptu),
      quartos: form.quartos ? parseInt(form.quartos) : null,
      area: parseMoeda(form.area),
      proprietario_id: form.proprietario_id || null,
      taxa_administracao_pct: form.proprietario_id ? (parseMoeda(form.taxa_administracao_pct) ?? 10) : 0,
    }
    const { error } = await supabase.from('imoveis').update(payload).eq('id', imovel.id)
    setLoading(false)
    if (error) { toast('Erro ao salvar: ' + error.message, 'error'); return }
    toast('Imóvel atualizado!', 'success')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset disabled={!podeEditar('imoveis')} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select id="tipo" label="Tipo *" options={tipoOptions} value={form.tipo} onChange={set('tipo')} />
        <Input id="codigo" label="Código" value={form.codigo} onChange={set('codigo')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input id="endereco" label="Endereço *" value={form.endereco} onChange={set('endereco')} required />
        </div>
        <Input id="numero" label="Número" value={form.numero} onChange={set('numero')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id="complemento" label="Complemento" value={form.complemento} onChange={set('complemento')} />
        <Input id="bairro" label="Bairro" value={form.bairro} onChange={set('bairro')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input id="cidade" label="Cidade *" value={form.cidade} onChange={set('cidade')} required />
        </div>
        <Input id="uf" label="UF *" value={form.uf} onChange={set('uf')} maxLength={2} required />
      </div>
      <div>
        <Input id="cep" label="CEP" value={form.cep} onChange={set('cep')} onBlur={handleCepBlur} />
        {buscandoCep && <p className="text-xs text-gray-400 mt-1">Buscando endereço...</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input id="valor_aluguel" label="Aluguel (R$)" type="text" inputMode="decimal" value={form.valor_aluguel} onChange={set('valor_aluguel')} />
        <Input id="valor_condominio" label="Condomínio (R$)" type="text" inputMode="decimal" value={form.valor_condominio} onChange={set('valor_condominio')} />
        <Input id="valor_iptu" label="IPTU (R$)" type="text" inputMode="decimal" value={form.valor_iptu} onChange={set('valor_iptu')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input id="quartos" label="Quartos" type="number" value={form.quartos} onChange={set('quartos')} />
        <Input id="area" label="Área (m²)" type="text" inputMode="decimal" value={form.area} onChange={set('area')} />
        <Select id="status" label="Status" options={statusOptions} value={form.status} onChange={set('status')} />
      </div>
      <Textarea id="descricao" label="Descrição" value={form.descricao} onChange={set('descricao')} rows={3} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-gray-200 p-4">
        <div className="sm:col-span-2 -mt-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Administração para terceiro</p>
          <p className="text-xs text-gray-400 mt-0.5">Deixe em branco se o imóvel é da própria locadora.</p>
        </div>
        <Select
          id="proprietario_id"
          label="Proprietário"
          options={proprietarios.map(p => ({ value: p.id, label: p.nome }))}
          placeholder="Imóvel próprio da locadora"
          value={form.proprietario_id}
          onChange={set('proprietario_id')}
        />
        <Input
          id="taxa_administracao_pct"
          label="Taxa de administração (%)"
          type="text"
          inputMode="decimal"
          placeholder="10"
          value={form.taxa_administracao_pct}
          onChange={set('taxa_administracao_pct')}
          disabled={!form.proprietario_id}
        />
      </div>
      </fieldset>
      {podeEditar('imoveis') && (
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>Salvar Alterações</Button>
        </div>
      )}
    </form>
  )
}
