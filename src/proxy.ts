import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // Link de acompanhamento compartilhado via WhatsApp — acessado por quem não
  // tem conta (visitante, inquilino sem login). Mesmo um admin/cliente logado
  // que abra o link deve ver a página normalmente, sem ser redirecionado.
  if (pathname.startsWith('/acompanhar/')) {
    return supabaseResponse
  }

  // Link de redefinição de senha vindo do e-mail do Supabase. Nesse momento
  // ainda não existe sessão nos cookies (o token vem na URL e só é trocado
  // por uma sessão no client, via JS) — não pode cair no "!user → /login"
  // nem no redirecionamento de "rota pública com usuário já logado".
  if (pathname === '/redefinir-senha') {
    return supabaseResponse
  }

  // Rotas públicas
  if (pathname === '/login' || pathname === '/esqueci-senha' || pathname === '/privacidade' || pathname === '/cadastro') {
    if (user) {
      // Usuário logado tentando acessar login → redireciona
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const dest = profile?.role === 'admin' ? '/admin/dashboard' : '/cliente/meu-imovel'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  // Usuário não logado → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar papel e rota
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/cliente/meu-imovel', request.url))
  }

  if (pathname.startsWith('/cliente') && profile?.role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Rota raiz
  if (pathname === '/') {
    const dest = profile?.role === 'admin' ? '/admin/dashboard' : '/cliente/meu-imovel'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
