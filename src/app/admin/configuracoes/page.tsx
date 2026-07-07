import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { ConfiguracoesForm } from '@/components/configuracoes/configuracoes-form'

export default async function ConfiguracoesAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nome, email, telefone')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div>
      <PageHeader title="Configurações" description="Atualize seus dados de acesso" />
      <ConfiguracoesForm profile={profile} />
    </div>
  )
}
