import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const EVENTOS_ATIVA = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'])
const EVENTOS_ATRASADA = new Set(['PAYMENT_OVERDUE'])
const EVENTOS_CANCELADA = new Set(['SUBSCRIPTION_DELETED', 'PAYMENT_DELETED', 'PAYMENT_REFUNDED'])

export async function POST(req: NextRequest) {
  // Autenticidade validada pelo token configurado no próprio painel do Asaas
  // ao cadastrar o webhook (reenviado em todo evento neste header) — não
  // depende de sessão/cookie, pois é o Asaas quem chama essa rota.
  const tokenRecebido = req.headers.get('asaas-access-token')
  if (!process.env.ASAAS_WEBHOOK_TOKEN || tokenRecebido !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const evento: string | undefined = body?.event
  const customerId: string | undefined = body?.payment?.customer
  if (!evento || !customerId) {
    return NextResponse.json({ received: true })
  }

  let novoStatus: 'ativa' | 'atrasada' | 'cancelada' | null = null
  if (EVENTOS_ATIVA.has(evento)) novoStatus = 'ativa'
  else if (EVENTOS_ATRASADA.has(evento)) novoStatus = 'atrasada'
  else if (EVENTOS_CANCELADA.has(evento)) novoStatus = 'cancelada'

  if (!novoStatus) return NextResponse.json({ received: true })

  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  await adminClient.from('locadoras').update({ assinatura_status: novoStatus }).eq('asaas_customer_id', customerId)

  return NextResponse.json({ received: true })
}
