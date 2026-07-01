'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { formatDatetime, tipoAgendamentoLabel, statusAgendamentoColor, statusAgendamentoLabel } from '@/lib/utils'
import { CheckCircle, X, MapPin, User, Phone, Mail, Link2, MessageCircle } from 'lucide-react'
import type { AgendamentoComRelacoes } from '@/lib/types'

function linkAcompanhamento(id: string) {
  return `${window.location.origin}/acompanhar/${id}`
}

function telefoneParaWhatsApp(telefone: string) {
  const digitos = telefone.replace(/\D/g, '')
  if (!digitos) return null
  return digitos.startsWith('55') ? digitos : `55${digitos}`
}

export function AgendaLista({ agendamentos: initial }: { agendamentos: AgendamentoComRelacoes[] }) {
  const [agendamentos, setAgendamentos] = useState(initial)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  async function updateStatus(id: string, status: 'realizado' | 'cancelado') {
    const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id)
    if (error) { toast('Erro: ' + error.message, 'error'); return }
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    toast('Status atualizado!', 'success')
    router.refresh()
  }

  async function copiarLink(ag: AgendamentoComRelacoes) {
    const link = linkAcompanhamento(ag.id)
    // navigator.clipboard só existe em contexto seguro (HTTPS ou localhost).
    // Acessando via IP na rede local (ex: para testar no celular) cai aqui.
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(link)
      toast('Link copiado!', 'success')
      return
    }
    const textarea = document.createElement('textarea')
    textarea.value = link
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copiado = document.execCommand('copy')
    document.body.removeChild(textarea)
    toast(copiado ? 'Link copiado!' : `Não foi possível copiar. Link: ${link}`, copiado ? 'success' : 'error')
  }

  function enviarWhatsApp(ag: AgendamentoComRelacoes) {
    const endereco = `${ag.imoveis?.endereco ?? ''}${ag.imoveis?.numero ? `, ${ag.imoveis.numero}` : ''}`
    const mensagem = `Olá! Segue o link para acompanhar sua ${tipoAgendamentoLabel(ag.tipo).toLowerCase()} em ${endereco}: ${linkAcompanhamento(ag.id)}`
    const telefone = ag.tipo === 'visita' ? ag.telefone_contato : ag.locacoes?.profiles?.telefone
    const numero = telefone ? telefoneParaWhatsApp(telefone) : null
    const url = `https://wa.me/${numero ?? ''}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-3">
      {agendamentos.map(ag => {
        const isChaves = ag.tipo !== 'visita'
        return (
          <Card key={ag.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs rounded-full px-2.5 py-0.5 font-medium bg-purple-100 text-purple-800">
                      {tipoAgendamentoLabel(ag.tipo)}
                    </span>
                    <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${statusAgendamentoColor(ag.status)}`}>
                      {statusAgendamentoLabel(ag.status)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-2 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {ag.imoveis?.endereco}{ag.imoveis?.numero ? `, ${ag.imoveis.numero}` : ''} — {ag.imoveis?.cidade}/{ag.imoveis?.uf}
                  </p>
                  {isChaves ? (
                    ag.locacoes?.profiles && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />{ag.locacoes.profiles.nome}
                        {ag.locacoes.profiles.telefone && (
                          <span className="flex items-center gap-1 ml-2"><Phone className="h-3 w-3" />{ag.locacoes.profiles.telefone}</span>
                        )}
                      </p>
                    )
                  ) : (
                    <p className="text-xs text-gray-500 flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{ag.nome_contato}</span>
                      {ag.telefone_contato && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{ag.telefone_contato}</span>}
                      {ag.email_contato && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{ag.email_contato}</span>}
                    </p>
                  )}
                  {ag.observacoes && <p className="text-xs text-gray-400 mt-1">{ag.observacoes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{formatDatetime(ag.data_hora)}</p>
                  <div className="flex gap-2 mt-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => copiarLink(ag)} title="Copiar link de acompanhamento">
                      <Link2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => enviarWhatsApp(ag)} title="Enviar por WhatsApp">
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  </div>
                  {ag.status === 'agendado' && (
                    <div className="flex gap-2 mt-2 justify-end">
                      <Button size="sm" variant="success" onClick={() => updateStatus(ag.id, 'realizado')}>
                        <CheckCircle className="h-3 w-3" />Realizado
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(ag.id, 'cancelado')}>
                        <X className="h-3 w-3" />Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
