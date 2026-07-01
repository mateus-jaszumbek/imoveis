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
  const { nome, email, telefone, cpf, senha } = body

  if (!nome || !email) {
    return NextResponse.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 })
  }
  if (!senha || senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  // Usa service role para criar o usuário
  const adminClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
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
    await adminClient.from('profiles')
      .update({ telefone: telefone || null, cpf: cpf || null, locadora_id: profile.locadora_id })
      .eq('id', userData.user.id)
  }

  return NextResponse.json({ success: true, user_id: userData?.user?.id })
}
