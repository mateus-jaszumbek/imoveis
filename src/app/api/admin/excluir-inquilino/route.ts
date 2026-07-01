import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, locadora_id').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID do inquilino é obrigatório' }, { status: 400 })

  // NÃO passa os cookies da sessão do admin — o createServerClient do
  // @supabase/ssr rehidrata a sessão a partir do cookie e a usa como
  // Authorization nas chamadas ao PostgREST, sobrepondo a service role key.
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )

  // Confirma que o inquilino pertence à mesma locadora de quem está pedindo
  // a exclusão (um admin não pode apagar/anonimizar dados de outra locadora).
  const { data: alvo } = await adminClient.from('profiles').select('id, role, locadora_id').eq('id', id).single()
  if (!alvo || alvo.role !== 'cliente' || alvo.locadora_id !== profile.locadora_id) {
    return NextResponse.json({ error: 'Inquilino não encontrado' }, { status: 404 })
  }

  const { count: totalLocacoes } = await adminClient
    .from('locacoes')
    .select('id', { count: 'exact', head: true })
    .eq('inquilino_id', id)

  if (!totalLocacoes) {
    // Sem nenhum histórico de locação — pode excluir de vez.
    const { error } = await (adminClient.auth as any).admin.deleteUser(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, acao: 'excluido' })
  }

  // Já teve locação — mantém o histórico (boletos/documentos/contratos têm
  // exigência legal de retenção), mas remove os dados pessoais identificáveis
  // e bloqueia o acesso, atendendo o direito de exclusão da LGPD sem apagar
  // registros que a locadora é obrigada a manter.
  const emailAnonimizado = `titular-removido-${id}@anonimizado.local`
  const senhaAleatoria = crypto.randomUUID()

  const { error: authError } = await (adminClient.auth as any).admin.updateUserById(id, {
    email: emailAnonimizado,
    password: senhaAleatoria,
    user_metadata: { nome: 'Titular removido' },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  await adminClient.from('profiles')
    .update({ nome: 'Titular removido', email: emailAnonimizado, telefone: null, cpf: null })
    .eq('id', id)

  return NextResponse.json({ success: true, acao: 'anonimizado' })
}
