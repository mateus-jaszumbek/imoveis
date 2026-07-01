'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChatAdmin } from './chat-admin'
import { formatDatetime, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function CaixaMensagens({ conversas }: { conversas: any[] }) {
  const [selecionada, setSelecionada] = useState<string | null>(conversas[0]?.id ?? null)

  const conversaAtual = conversas.find(c => c.id === selecionada)

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      <div className="w-80 shrink-0 overflow-y-auto space-y-1">
        {conversas.map((conv) => {
          const msgs = conv.mensagens ?? []
          const ultimaMsg = msgs.sort((a: any, b: any) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())[0]
          const naoLidas = msgs.filter((m: any) => !m.lida && m.autor_role === 'cliente').length
          const inquilino = conv.locacoes?.profiles
          const imovel = conv.locacoes?.imoveis

          return (
            <button
              key={conv.id}
              onClick={() => setSelecionada(conv.id)}
              className={cn(
                'w-full text-left rounded-xl p-3 transition-colors',
                selecionada === conv.id ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-100 hover:bg-gray-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 font-semibold text-sm shrink-0">
                    {getInitials(inquilino?.nome ?? '?')}
                  </div>
                  {naoLidas > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {naoLidas}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{inquilino?.nome ?? '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{imovel?.endereco}{imovel?.numero ? `, ${imovel.numero}` : ''}</p>
                  {ultimaMsg && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{ultimaMsg.texto ?? '📎 Anexo'}</p>
                  )}
                </div>
                {ultimaMsg && (
                  <p className="text-xs text-gray-400 shrink-0">{new Date(ultimaMsg.criado_em).toLocaleDateString('pt-BR')}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex-1 min-w-0">
        {selecionada ? (
          <div>
            {conversaAtual && (
              <div className="mb-3">
                <p className="font-semibold text-gray-900">{conversaAtual.locacoes?.profiles?.nome}</p>
                <p className="text-xs text-gray-500">{conversaAtual.locacoes?.imoveis?.endereco}</p>
              </div>
            )}
            <ChatAdmin conversaId={selecionada} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  )
}
