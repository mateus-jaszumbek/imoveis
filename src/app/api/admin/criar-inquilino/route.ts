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

  const { data: profile } = await supabase.from('profiles').select('role, locadora_id').eq('id', user.id).single()
  if (!profile || !await podeGerenciarSecao(supabase, user.id, profile.role, 'inquilinos')) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const { nome, email, telefone, cpf, senha, aceite } = body

  if (!nome || !email) {
    return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 })
  }
  if (!senha || senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }
  if (!aceite) {
    return NextResponse.json({ error: 'É necessário confirmar a ciência sobre o tratamento de dados (LGPD)' }, { status: 400 })
  }

  // Usa service role para criar o usuário. NÃO passa os cookies da sessão do
  // admin logado — o createServerClient do @supabase/ssr rehidrata a sessão a
  // partir do cookie e a usa como Authorization nas chamadas ao PostgREST,
  // sobrepondo a service role key (RLS acaba filtrando silenciosamente linhas
  // que ainda não pertencem à locadora do admin, como o perfil recém-criado).
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

  // Cria o usuário já com a senha definida pelo admin — o inquilino recebe
  // o e-mail e a senha diretamente do admin (ex: WhatsApp), sem depender de
  // envio de e-mail de convite.
  const { data: userData, error: createError } = await (adminClient.auth as any).admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, role: 'cliente' },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  if (userData?.user?.id) {
    // GoTrue não define auth.users.role='authenticated' automaticamente ao
    // criar pela Admin API — sem isso, o PostgREST falha ao trocar de role
    // Postgres (JWT role claim fica vazio) e o login do inquilino quebra.
    await (adminClient.auth as any).admin.updateUserById(userData.user.id, { role: 'authenticated' })
    const { error: profileError } = await adminClient.from('profiles')
      .update({
        telefone: telefone || null,
        cpf: cpf || null,
        locadora_id: profile.locadora_id,
        consentimento_lgpd_em: new Date().toISOString(),
      })
      .eq('id', userData.user.id)
    if (profileError) {
      return NextResponse.json({ error: 'Usuário criado, mas falha ao salvar perfil: ' + profileError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true, user_id: userData?.user?.id })
}
