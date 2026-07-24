import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()

  // Verifica se quem chama é admin
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

  // Usa service role para criar o usuário — mesmo motivo do criar-inquilino:
  // não passar os cookies da sessão do admin, para a service role key não ser
  // sobreposta pela sessão do admin logado nas chamadas ao PostgREST.
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

  const { data: userData, error: createError } = await (adminClient.auth as any).admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, role: 'proprietario' },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  if (userData?.user?.id) {
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
