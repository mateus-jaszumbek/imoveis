// Integração com o Asaas (gateway de pagamento) para a assinatura mensal.
// Requer as variáveis de ambiente ASAAS_API_KEY e ASAAS_API_URL — sem elas,
// as funções abaixo lançam um erro claro em vez de falhar silenciosamente.
// ASAAS_API_URL: https://api-sandbox.asaas.com/v3 (teste) ou
// https://api.asaas.com/v3 (produção).

function configurado() {
  return Boolean(process.env.ASAAS_API_KEY && process.env.ASAAS_API_URL)
}

async function chamarAsaas(caminho: string, opcoes: RequestInit = {}) {
  if (!configurado()) {
    throw new Error('Assinatura ainda não configurada pela imobiliária (variáveis ASAAS_API_KEY/ASAAS_API_URL ausentes). Fale com o suporte.')
  }
  const res = await fetch(`${process.env.ASAAS_API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      access_token: process.env.ASAAS_API_KEY!,
      ...opcoes.headers,
    },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const mensagem = json?.errors?.[0]?.description ?? `Erro ao comunicar com o Asaas (${res.status})`
    throw new Error(mensagem)
  }
  return json
}

export interface AsaasCliente {
  id: string
}

export async function criarClienteAsaas(params: { nome: string; email: string; cpfCnpj: string; externalReference: string }): Promise<AsaasCliente> {
  return chamarAsaas('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: params.nome,
      email: params.email,
      cpfCnpj: params.cpfCnpj.replace(/\D/g, ''),
      externalReference: params.externalReference,
    }),
  })
}

export interface AsaasAssinatura {
  id: string
}

export async function criarAssinaturaAsaas(params: { customerId: string; nextDueDate: string }): Promise<AsaasAssinatura> {
  return chamarAsaas('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'UNDEFINED',
      value: 150,
      cycle: 'MONTHLY',
      nextDueDate: params.nextDueDate,
      description: 'Assinatura mensal — Locadora (painel de gestão)',
    }),
  })
}

export async function buscarPrimeiraFaturaDaAssinatura(subscriptionId: string): Promise<string> {
  const json = await chamarAsaas(`/payments?subscription=${subscriptionId}&limit=1`)
  const invoiceUrl = json?.data?.[0]?.invoiceUrl
  if (!invoiceUrl) throw new Error('Assinatura criada, mas não foi possível obter o link de pagamento. Tente novamente em instantes.')
  return invoiceUrl
}
