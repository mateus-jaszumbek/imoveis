import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { criarClienteAsaas, criarAssinaturaAsaas, buscarPrimeiraFaturaDaAssinatura } from '@/lib/asaas'

function formatarData(data: Date): string {
  return data.toISOString().split('T')[0]
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, nome, email, cpf, locadora_id').eq('id', user.id).single()
  if (profile?.role !== 'admin' || !profile.locadora_id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const cpfCnpj: string | undefined = body?.cpfCnpj
  const cpfFinal = profile.cpf || cpfCnpj
  if (!cpfFinal) {
    return NextResponse.json({ error: 'Informe o CPF ou CNPJ para gerar a cobrança' }, { status: 400 })
  }

  const { data: locadora } = await supabase.from('locadoras').select('*').eq('id', profile.locadora_id).single()
  if (!locadora) return NextResponse.json({ error: 'Locadora não encontrada' }, { status: 404 })

  try {
    if (cpfCnpj && !profile.cpf) {
      await supabase.from('profiles').update({ cpf: cpfCnpj }).eq('id', user.id)
    }

    let customerId = locadora.asaas_customer_id
    if (!customerId) {
      const cliente = await criarClienteAsaas({
        nome: profile.nome,
        email: profile.email,
        cpfCnpj: cpfFinal,
        externalReference: locadora.id,
      })
      customerId = cliente.id
      await supabase.from('locadoras').update({ asaas_customer_id: customerId }).eq('id', locadora.id)
    }

    const trialAindaAtivo = new Date(locadora.trial_termina_em) > new Date()
    const nextDueDate = formatarData(trialAindaAtivo ? new Date(locadora.trial_termina_em) : new Date())

    const assinatura = await criarAssinaturaAsaas({ customerId, nextDueDate })
    await supabase.from('locadoras').update({ asaas_subscription_id: assinatura.id }).eq('id', locadora.id)

    const invoiceUrl = await buscarPrimeiraFaturaDaAssinatura(assinatura.id)
    return NextResponse.json({ invoiceUrl })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao criar assinatura' }, { status: 502 })
  }
}
