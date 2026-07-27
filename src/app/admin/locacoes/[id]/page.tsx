import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DocumentoUpload } from '@/components/documentos/documento-upload'
import { BoletosLocacao } from '@/components/boletos/boletos-locacao'
import { ChatAdmin } from '@/components/chat/chat-admin'
import { EncerrarLocacao } from '@/components/locacoes/encerrar-locacao'
import { ReajusteLocacao } from '@/components/locacoes/reajuste-locacao'
import { SePodeEditar } from '@/components/layout/se-pode-editar'

export default async function LocacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: locacao } = await supabase
    .from('locacoes')
    .select('*, imoveis(id, endereco, numero, cidade, uf), profiles(id, nome, email, telefone)')
    .eq('id', id)
    .single()

  if (!locacao) notFound()

  const { data: conversa } = await supabase
    .from('conversas')
    .select('id')
    .eq('locacao_id', id)
    .single()

  const { data: reajustes } = await supabase
    .from('reajustes')
    .select('*')
    .eq('locacao_id', id)
    .order('aplicado_em', { ascending: false })

  return (
    <div>
      <Link href="/admin/locacoes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {(locacao as any).profiles?.nome}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {(locacao as any).imoveis?.endereco}{(locacao as any).imoveis?.numero ? `, ${(locacao as any).imoveis.numero}` : ''} · {(locacao as any).imoveis?.cidade}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${locacao.status === 'ativa' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {locacao.status === 'ativa' ? 'Ativa' : 'Encerrada'}
          </span>
          {locacao.status === 'ativa' && (
            <SePodeEditar secao="locacoes">
              <EncerrarLocacao locacaoId={locacao.id} imovelId={(locacao as any).imovel_id} />
            </SePodeEditar>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BoletosLocacao locacaoId={locacao.id} />
          <DocumentoUpload locacaoId={locacao.id} title="Contratos e Documentos" />
          {conversa && <ChatAdmin conversaId={conversa.id} />}
        </div>

        <div className="space-y-6">
          <ReajusteLocacao
            locacaoId={locacao.id}
            valorAtual={locacao.valor}
            indiceReajuste={locacao.indice_reajuste}
            historico={reajustes ?? []}
          />

          <Card>
            <CardHeader><CardTitle>Resumo da Locação</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Inquilino</span>
                <span className="font-medium">{(locacao as any).profiles?.nome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">E-mail</span>
                <span className="font-medium text-xs">{(locacao as any).profiles?.email}</span>
              </div>
              {(locacao as any).profiles?.telefone && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Telefone</span>
                  <span className="font-medium">{(locacao as any).profiles?.telefone}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Aluguel</span>
                  <span className="font-bold text-gray-900">{formatCurrency(locacao.valor)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Vencimento</span>
                  <span className="font-medium">Todo dia {locacao.dia_vencimento}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Início</span>
                  <span className="font-medium">{formatDate(locacao.data_inicio)}</span>
                </div>
                {locacao.data_fim && (
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-500">Término</span>
                    <span className="font-medium">{formatDate(locacao.data_fim)}</span>
                  </div>
                )}
              </div>
              {(locacao.seguro_corretora || locacao.seguro_apolice) && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Seguro-Fiança</p>
                  {locacao.seguro_corretora && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Corretora</span>
                      <span className="font-medium">{locacao.seguro_corretora}</span>
                    </div>
                  )}
                  {locacao.seguro_apolice && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Apólice</span>
                      <span className="font-medium">{locacao.seguro_apolice}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Links Rápidos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/imoveis/${(locacao as any).imovel_id}`} className="block text-sm text-blue-600 hover:underline">Ver imóvel →</Link>
              <Link href={`/admin/inquilinos/${(locacao as any).inquilino_id}`} className="block text-sm text-blue-600 hover:underline">Ver inquilino →</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
