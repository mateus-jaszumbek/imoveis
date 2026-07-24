import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AssinarButton } from '@/components/assinatura/assinar-button'
import { formatCurrency, formatDate, diasAte } from '@/lib/utils'
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react'

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('cpf, locadoras(nome, assinatura_status, trial_termina_em)')
    .eq('id', user!.id)
    .single()

  const locadora = profile?.locadoras as unknown as { nome: string; assinatura_status: string; trial_termina_em: string } | null
  const status = locadora?.assinatura_status ?? 'trial'
  const diasRestantes = locadora ? diasAte(locadora.trial_termina_em) : 0
  const trialAtivo = status === 'trial' && diasRestantes >= 0
  const trialVencido = status === 'trial' && diasRestantes < 0

  const statusInfo = {
    ativa: { icon: CheckCircle2, cor: 'text-green-600 bg-green-50', titulo: 'Assinatura ativa', desc: 'Sua imobiliária está com o acesso liberado.' },
    atrasada: { icon: AlertTriangle, cor: 'text-yellow-600 bg-yellow-50', titulo: 'Pagamento atrasado', desc: 'Regularize o pagamento para não perder o acesso ao painel.' },
    cancelada: { icon: XCircle, cor: 'text-red-600 bg-red-50', titulo: 'Assinatura cancelada', desc: 'Assine novamente para voltar a usar o painel.' },
  } as const

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
        <p className="mt-1 text-sm text-gray-500">Plano único — todos os módulos inclusos</p>
      </div>

      <Card className="mb-6">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-gray-500">Plano mensal</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">{formatCurrency(150)}<span className="text-base font-medium text-gray-500">/mês</span></p>
          <p className="text-xs text-gray-400 mt-1">Cartão, PIX ou boleto — cancele quando quiser</p>
        </CardContent>
      </Card>

      {trialAtivo && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Teste grátis — {diasRestantes === 0 ? 'termina hoje' : diasRestantes === 1 ? 'termina em 1 dia' : `termina em ${diasRestantes} dias`}
              </p>
              <p className="text-sm text-gray-500">Depois de {formatDate(locadora!.trial_termina_em)}, é necessário assinar para continuar usando o painel.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {trialVencido && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Seu teste grátis acabou</p>
              <p className="text-sm text-gray-500">Assine para continuar usando o painel — seus dados continuam salvos.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(status === 'atrasada' || status === 'cancelada' || status === 'ativa') && (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 py-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${statusInfo[status].cor}`}>
              {(() => { const Icon = statusInfo[status].icon; return <Icon className="h-5 w-5" /> })()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{statusInfo[status].titulo}</p>
              <p className="text-sm text-gray-500">{statusInfo[status].desc}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {status !== 'ativa' && (
        <Card>
          <CardHeader><CardTitle>Assinar</CardTitle></CardHeader>
          <CardContent>
            <AssinarButton temCpf={Boolean(profile?.cpf)} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
