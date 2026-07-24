import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { buscarVariacaoAcumulada12Meses } from '@/lib/indices-economicos'

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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { locacaoId } = await req.json()
  if (!locacaoId) return NextResponse.json({ error: 'locacaoId é obrigatório' }, { status: 400 })

  // A query já respeita RLS (sessão do próprio admin) — só calcula reajuste
  // de locação da locadora dele.
  const { data: locacao } = await supabase.from('locacoes').select('id, valor, indice_reajuste').eq('id', locacaoId).single()
  if (!locacao) return NextResponse.json({ error: 'Locação não encontrada' }, { status: 404 })

  const indice = locacao.indice_reajuste as 'igpm' | 'ipca' | 'inpc' | null
  if (!indice || !['igpm', 'ipca', 'inpc'].includes(indice)) {
    return NextResponse.json({ error: 'Esta locação não tem um índice de reajuste válido (IGP-M, IPCA ou INPC) definido' }, { status: 400 })
  }

  try {
    const percentual = await buscarVariacaoAcumulada12Meses(indice)
    const valorAnterior = Number(locacao.valor)
    const valorNovo = Math.round(valorAnterior * (1 + percentual / 100) * 100) / 100
    return NextResponse.json({ indice, percentual, valorAnterior, valorNovo })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao calcular reajuste' }, { status: 502 })
  }
}
