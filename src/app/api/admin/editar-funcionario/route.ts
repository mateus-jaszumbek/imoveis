import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SECOES_FUNCIONARIO } from '@/lib/types'

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

  const body = await req.json()
  const { id, nome, email, telefone, cpf, senha, ativo, permissoes } = body

  if (!id || !nome || !email) {
    return NextResponse.json({ error: 'ID, nome e e-mail são obrigatórios' }, { status: 400 })
  }
  if (senha && senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

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

  // Confirma que o alvo é mesmo um funcionário da mesma locadora de quem
  // está editando (um admin não pode mexer no funcionário de outra locadora).
  const { data: alvo } = await adminClient.from('profiles').select('id, role, locadora_id').eq('id', id).single()
  if (!alvo || alvo.role !== 'funcionario' || alvo.locadora_id !== profile.locadora_id) {
    return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 })
  }

  const authUpdate: Record<string, unknown> = { email, email_confirm: true, user_metadata: { nome, role: 'funcionario' } }
  if (senha) authUpdate.password = senha

  const { error: authError } = await (adminClient.auth as any).admin.updateUserById(id, authUpdate)
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ nome, email, telefone: telefone || null, cpf: cpf || null, ativo: ativo !== false })
    .eq('id', id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  if (Array.isArray(permissoes)) {
    const secoesValidas = new Set(SECOES_FUNCIONARIO.map(s => s.secao))
    const permissoesValidas = permissoes
      .filter(p => secoesValidas.has(p?.secao))
      .map(p => ({ profile_id: id, secao: p.secao, pode_editar: p.secao === 'financeiro' ? false : !!p.pode_editar }))

    const { error: deleteError } = await adminClient.from('funcionario_permissoes').delete().eq('profile_id', id)
    if (deleteError) {
      return NextResponse.json({ error: 'Dados salvos, mas falha ao atualizar permissões: ' + deleteError.message }, { status: 500 })
    }
    if (permissoesValidas.length) {
      const { error: insertError } = await adminClient.from('funcionario_permissoes').insert(permissoesValidas)
      if (insertError) {
        return NextResponse.json({ error: 'Dados salvos, mas falha ao atualizar permissões: ' + insertError.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true })
}
