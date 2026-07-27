import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function destinoPorPapel(role: string | undefined): string {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'proprietario') return '/proprietario/meus-imoveis'
  return '/cliente/meu-imovel'
}

// Nunca redireciona para a própria rota atual — se o papel não puder ser
// determinado (perfil não encontrado, consulta falhou, etc.), o destino por
// papel pode coincidir com a rota que já bloqueou o acesso, causando um loop
// infinito de redirecionamento. Nesse caso, deixa passar em vez de travar o
// site inteiro (a proteção real dos dados continua sendo o RLS do banco).
function redirecionarParaPapelOu(request: NextRequest, pathname: string, role: string | undefined, resposta: NextResponse): NextResponse {
  const dest = destinoPorPapel(role)
  if (dest === pathname) return resposta
  return NextResponse.redirect(new URL(dest, request.url))
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Rota pública de bootstrap (cria a locadora + o primeiro admin) — chamada
  // via fetch() sem sessão, não pode ser redirecionada para /login.
  if (pathname === '/api/cadastro-admin') {
    return supabaseResponse
  }

  // Webhook do Asaas — chamado pelo servidor do Asaas, sem cookie de sessão.
  // Autenticado pelo próprio token no header (validado dentro da rota).
  if (pathname === '/api/webhooks/asaas') {
    return supabaseResponse
  }

  // Link de acompanhamento compartilhado via WhatsApp — acessado por quem não
  // tem conta (visitante, inquilino sem login). Mesmo um admin/cliente logado
  // que abra o link deve ver a página normalmente, sem ser redirecionado.
  if (pathname.startsWith('/acompanhar/')) {
    return supabaseResponse
  }

  // Apresentação comercial (slideshow) — enviada por link para clientes que
  // não têm conta, e também deve abrir normalmente para quem já está logado.
  if (pathname.startsWith('/apresentacao')) {
    return supabaseResponse
  }

  // Link de redefinição de senha vindo do e-mail do Supabase. Nesse momento
  // ainda não existe sessão nos cookies (o token vem na URL e só é trocado
  // por uma sessão no client, via JS) — não pode cair no "!user → /login"
  // nem no redirecionamento de "rota pública com usuário já logado".
  if (pathname === '/redefinir-senha') {
    return supabaseResponse
  }

  // Rotas públicas (inclui "/", que agora é a landing page comercial)
  if (pathname === '/' || pathname === '/login' || pathname === '/esqueci-senha' || pathname === '/privacidade' || pathname === '/cadastro') {
    if (user) {
      // Usuário logado tentando acessar login → redireciona
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      return redirecionarParaPapelOu(request, pathname, profile?.role, supabaseResponse)
    }
    return supabaseResponse
  }

  // Usuário não logado → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar papel e rota — consulta simples e isolada. Não junta com dados
  // de assinatura aqui: se aquela consulta falhar ou vier vazia por qualquer
  // motivo (cache de schema, coluna nova, instabilidade pontual), isso NÃO
  // pode derrubar a decisão de papel e mandar um admin pro portal errado.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return redirecionarParaPapelOu(request, pathname, profile?.role, supabaseResponse)
  }

  // Bloqueia o painel admin (exceto a própria tela de assinatura) quando o
  // trial acabou sem assinatura ativa, ou a assinatura está atrasada/cancelada.
  // Só afeta /admin — o portal do inquilino/proprietário continua acessível.
  // Consulta separada e "fail-open": qualquer erro aqui não bloqueia o admin
  // nem afeta a checagem de papel acima — na dúvida, libera o acesso.
  if (pathname.startsWith('/admin') && profile?.role === 'admin' && pathname !== '/admin/assinatura') {
    const { data: profileComLocadora } = await supabase
      .from('profiles')
      .select('locadora_id')
      .eq('id', user.id)
      .single()

    const { data: locadora } = profileComLocadora?.locadora_id
      ? await supabase
          .from('locadoras')
          .select('assinatura_status, trial_termina_em')
          .eq('id', profileComLocadora.locadora_id)
          .maybeSingle()
      : { data: null }

    if (locadora) {
      const trialVencido = new Date(locadora.trial_termina_em) < new Date()
      const bloqueado = locadora.assinatura_status === 'atrasada'
        || locadora.assinatura_status === 'cancelada'
        || (locadora.assinatura_status === 'trial' && trialVencido)
      if (bloqueado) {
        return NextResponse.redirect(new URL('/admin/assinatura', request.url))
      }
    }
  }

  if (pathname.startsWith('/cliente') && profile?.role !== 'cliente') {
    return redirecionarParaPapelOu(request, pathname, profile?.role, supabaseResponse)
  }

  if (pathname.startsWith('/proprietario') && profile?.role !== 'proprietario') {
    return redirecionarParaPapelOu(request, pathname, profile?.role, supabaseResponse)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
