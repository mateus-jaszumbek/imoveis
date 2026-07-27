import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { validarCpfCnpj } from '@/lib/validators'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome_locadora, nome, email, cpfCnpj, senha, aceite } = body

  if (!nome_locadora || !nome || !email) {
    return NextResponse.json({ error: 'Nome da locadora, seu nome e e-mail são obrigatórios' }, { status: 400 })
  }
  if (!validarCpfCnpj(cpfCnpj ?? '')) {
    return NextResponse.json({ error: 'Informe um CPF ou CNPJ válido' }, { status: 400 })
  }
  if (!senha || senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }
  if (!aceite) {
    return NextResponse.json({ error: 'É necessário concordar com a Política de Privacidade' }, { status: 400 })
  }

  // Rota pública (bootstrap de uma nova locadora) — usa service role. Não
  // repassa cookies: o createServerClient do @supabase/ssr rehidrata a sessão
  // a partir do cookie (se alguém já logado como outro admin acessar essa
  // rota) e a usa como Authorization nas chamadas ao PostgREST, sobrepondo a
  // service role key.
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

  const { data: locadora, error: locadoraError } = await adminClient
    .from('locadoras')
    .insert({ nome: nome_locadora })
    .select()
    .single()

  if (locadoraError || !locadora) {
    return NextResponse.json({ error: locadoraError?.message ?? 'Erro ao criar locadora' }, { status: 400 })
  }

  const { data: userData, error: createError } = await (adminClient.auth as any).admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, role: 'admin' },
  })

  if (createError || !userData?.user?.id) {
    // Evita locadora órfã se a criação do usuário falhar
    await adminClient.from('locadoras').delete().eq('id', locadora.id)
    return NextResponse.json({ error: createError?.message ?? 'Erro ao criar usuário' }, { status: 400 })
  }

  // GoTrue não define auth.users.role='authenticated' automaticamente ao criar
  // pela Admin API — sem isso, o PostgREST falha ao trocar de role Postgres
  // (JWT role claim fica vazio) e o login do admin quebra.
  await (adminClient.auth as any).admin.updateUserById(userData.user.id, { role: 'authenticated' })
  const { error: profileError } = await adminClient.from('profiles')
    .update({ role: 'admin', locadora_id: locadora.id, cpf: cpfCnpj.replace(/\D/g, ''), consentimento_lgpd_em: new Date().toISOString() })
    .eq('id', userData.user.id)

  if (profileError) {
    return NextResponse.json({ error: 'Usuário criado, mas falha ao salvar perfil: ' + profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
