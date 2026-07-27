import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { podeGerenciarSecao } from '@/lib/permissoes'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  // Verifica se quem chama é admin ou funcionário com permissão de editar em 'inquilinos'
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!await podeGerenciarSecao(supabase, user.id, profile?.role, 'inquilinos')) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const { id, nome, email, telefone, cpf, senha } = body

  if (!id || !nome || !email) {
    return NextResponse.json({ error: 'ID, nome e e-mail são obrigatórios' }, { status: 400 })
  }
  if (senha && senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  // Usa service role para alterar e-mail/senha de login (a tabela profiles
  // sozinha não controla o login — quem faz isso é o auth.users do GoTrue).
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

  const authUpdate: Record<string, unknown> = { email, email_confirm: true, user_metadata: { nome, role: 'cliente' } }
  if (senha) authUpdate.password = senha

  const { error: authError } = await (adminClient.auth as any).admin.updateUserById(id, authUpdate)
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // profiles.email é uma cópia — precisa ser atualizada manualmente junto com auth.users.email
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ nome, email, telefone: telefone || null, cpf: cpf || null })
    .eq('id', id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
