'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Send, Paperclip, Image, FileText, X } from 'lucide-react'
import { usePermissoes } from '@/components/providers/permissoes-provider'
import { formatDatetime, getInitials } from '@/lib/utils'
import type { MensagemComAnexos } from '@/lib/types'

export function ChatAdmin({ conversaId }: { conversaId: string }) {
  const [mensagens, setMensagens] = useState<MensagemComAnexos[]>([])
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const [anexos, setAnexos] = useState<File[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { toast } = useToast()
  const { podeEditar } = usePermissoes()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setProfileId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    loadMensagens()
    // Realtime subscription
    const channel = supabase
      .channel(`chat-${conversaId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens',
        filter: `conversa_id=eq.${conversaId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('mensagens')
          .select('*, profiles(nome), mensagem_anexos(*)')
          .eq('id', payload.new.id)
          .single()
        if (data) setMensagens(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data as MensagemComAnexos])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversaId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function loadMensagens() {
    const { data } = await supabase
      .from('mensagens')
      .select('*, profiles(nome), mensagem_anexos(*)')
      .eq('conversa_id', conversaId)
      .order('criado_em')
    if (data) setMensagens(data as MensagemComAnexos[])
    // Marca mensagens não lidas do cliente como lidas
    await supabase.from('mensagens').update({ lida: true })
      .eq('conversa_id', conversaId).eq('autor_role', 'cliente').eq('lida', false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() && !anexos.length) return
    if (!profileId) return
    setSending(true)

    const { data: msg, error } = await supabase.from('mensagens').insert({
      conversa_id: conversaId,
      autor_id: profileId,
      autor_role: 'admin',
      texto: texto.trim() || null,
    }).select('*, profiles(nome), mensagem_anexos(*)').single()

    if (error || !msg) { toast('Erro ao enviar', 'error'); setSending(false); return }

    // Upload anexos
    for (const file of anexos) {
      const tipo = file.type.startsWith('image/') ? 'imagem' : 'pdf'
      const path = `${conversaId}/${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('chat-anexos').upload(path, file)
      if (!uploadErr) {
        await supabase.from('mensagem_anexos').insert({
          mensagem_id: msg.id,
          tipo,
          url: path,
          nome_arquivo: file.name,
          tamanho: file.size,
        })
      }
    }

    setTexto('')
    setAnexos([])
    setSending(false)
    await loadMensagens()
  }

  async function getAnexoUrl(path: string) {
    const { data } = await supabase.storage.from('chat-anexos').createSignedUrl(path, 300)
    return data?.signedUrl
  }

  async function openAnexo(path: string) {
    const url = await getAnexoUrl(path)
    if (url) window.open(url, '_blank')
  }

  return (
    <Card>
      <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
      <div className="flex flex-col h-96">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!mensagens.length && (
            <p className="text-center text-sm text-gray-400">Nenhuma mensagem ainda</p>
          )}
          {mensagens.map(msg => {
            const isAdmin = msg.autor_role === 'admin'
            return (
              <div key={msg.id} className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0 ${isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                  {getInitials(msg.profiles?.nome ?? (isAdmin ? 'ADM' : '?'))}
                </div>
                <div className={`max-w-xs lg:max-w-md ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-3 py-2 text-sm ${isAdmin ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                    {msg.texto && <p>{msg.texto}</p>}
                    {msg.mensagem_anexos?.map(a => (
                      <button key={a.id} onClick={() => openAnexo(a.url)} className={`flex items-center gap-1 mt-1 text-xs underline ${isAdmin ? 'text-blue-100' : 'text-blue-600'}`}>
                        {a.tipo === 'imagem' ? <Image className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {a.nome_arquivo}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDatetime(msg.criado_em)}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {anexos.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2 flex gap-2 flex-wrap">
            {anexos.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-blue-50 rounded-full px-2 py-1 text-xs text-blue-700">
                <Paperclip className="h-3 w-3" />{f.name}
                <button onClick={() => setAnexos(prev => prev.filter((_, j) => j !== i))}>
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {podeEditar('mensagens') ? (
          <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => setAnexos(prev => [...prev, ...Array.from(e.target.files ?? [])])}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-gray-400 hover:text-gray-600 shrink-0">
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" size="sm" loading={sending} disabled={!texto.trim() && !anexos.length}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="border-t border-gray-100 p-3 text-center text-xs text-gray-400">Você não tem permissão para responder mensagens.</p>
        )}
      </div>
    </Card>
  )
}
