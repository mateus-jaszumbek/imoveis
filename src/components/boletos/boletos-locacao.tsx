'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatDate, statusBoletoColor, statusBoletoLabel, formatMesReferencia, parseMoeda } from '@/lib/utils'
import { Plus, CheckCircle, Clock, AlertTriangle, Upload, Download } from 'lucide-react'
import type { Boleto } from '@/lib/types'

export function BoletosLocacao({ locacaoId }: { locacaoId: string }) {
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const hoje = new Date()
  const defaultMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

  const [form, setForm] = useState({
    mes_referencia: defaultMes,
    vencimento: '',
    valor: '',
    descricao: '',
    linha_digitavel: '',
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  useEffect(() => {
    supabase.from('boletos').select('*').eq('locacao_id', locacaoId).order('vencimento', { ascending: false })
      .then(({ data }) => { if (data) setBoletos(data as Boleto[]) })
  }, [locacaoId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    let url_pdf: string | null = null
    if (pdfFile) {
      const path = `${locacaoId}/boleto-${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage.from('documentos').upload(path, pdfFile)
      if (!uploadError) url_pdf = path
    }
    const { data, error } = await supabase.from('boletos').insert({
      locacao_id: locacaoId,
      mes_referencia: form.mes_referencia,
      vencimento: form.vencimento,
      valor: parseMoeda(form.valor) ?? 0,
      descricao: form.descricao || null,
      linha_digitavel: form.linha_digitavel || null,
      url_pdf,
    }).select().single()
    setLoading(false)
    if (error) { toast('Erro: ' + error.message, 'error'); return }
    if (data) setBoletos(prev => [data as Boleto, ...prev])
    toast('Boleto cadastrado!', 'success')
    setShowModal(false)
    setPdfFile(null)
    setForm({ mes_referencia: defaultMes, vencimento: '', valor: '', descricao: '', linha_digitavel: '' })
  }

  async function updateStatus(id: string, status: 'em_aberto' | 'pago' | 'vencido') {
    const pago_em = status === 'pago' ? new Date().toISOString().split('T')[0] : null
    await supabase.from('boletos').update({ status, pago_em }).eq('id', id)
    setBoletos(prev => prev.map(b => b.id === id ? { ...b, status: status as Boleto['status'], pago_em } : b))
    toast('Status atualizado!', 'success')
  }

  async function handleDownloadBoleto(boleto: Boleto) {
    if (!boleto.url_pdf) return
    const { data } = await supabase.storage.from('documentos').createSignedUrl(boleto.url_pdf, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const statusIcon = { em_aberto: Clock, pago: CheckCircle, vencido: AlertTriangle }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Boletos</CardTitle>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />Novo Boleto
            </Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-gray-50">
          {!boletos.length ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">Nenhum boleto cadastrado</p>
          ) : boletos.map(boleto => {
            const Icon = statusIcon[boleto.status] ?? Clock
            return (
              <div key={boleto.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${boleto.status === 'pago' ? 'text-green-600' : boleto.status === 'vencido' ? 'text-red-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{formatMesReferencia(boleto.mes_referencia)}</p>
                    {boleto.descricao && <p className="text-xs text-gray-500">{boleto.descricao}</p>}
                    <p className="text-xs text-gray-400">Venc: {formatDate(boleto.vencimento)}</p>
                    {boleto.linha_digitavel && (
                      <p className="text-xs text-gray-400 font-mono">{boleto.linha_digitavel}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{formatCurrency(boleto.valor)}</p>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${statusBoletoColor(boleto.status)}`}>
                    {statusBoletoLabel(boleto.status)}
                  </span>
                  <div className="flex gap-1 mt-1 justify-end">
                    {boleto.status !== 'pago' && (
                      <Button size="sm" variant="success" onClick={() => updateStatus(boleto.id, 'pago')}>
                        <CheckCircle className="h-3 w-3" />Pago
                      </Button>
                    )}
                    {boleto.status === 'pago' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(boleto.id, 'em_aberto')}>
                        Reabrir
                      </Button>
                    )}
                    {boleto.url_pdf && (
                      <Button size="sm" variant="outline" onClick={() => handleDownloadBoleto(boleto)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Boleto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="mes_referencia" label="Mês de Referência *" type="month" value={form.mes_referencia} onChange={set('mes_referencia')} required />
          <Input id="vencimento" label="Vencimento *" type="date" value={form.vencimento} onChange={set('vencimento')} required />
          <Input id="valor" label="Valor (R$) *" type="text" inputMode="decimal" placeholder="1500,00" value={form.valor} onChange={set('valor')} required />
          <Input id="descricao" label="Descrição" value={form.descricao} onChange={set('descricao')} placeholder="Aluguel + condomínio + água..." />
          <Input id="linha_digitavel" label="Linha Digitável" value={form.linha_digitavel} onChange={set('linha_digitavel')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">PDF do Boleto</label>
            <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] ?? null)} className="text-sm text-gray-600" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Cadastrar</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
