'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Receipt, FileText, MessageSquare, LogOut, ChevronRight, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/cliente/meu-imovel', label: 'Meu Imóvel', icon: Building2 },
  { href: '/cliente/meus-boletos', label: 'Meus Boletos', icon: Receipt },
  { href: '/cliente/meus-documentos', label: 'Meus Documentos', icon: FileText },
  { href: '/cliente/chat', label: 'Chat', icon: MessageSquare },
]

export function SidebarCliente({ nomeUsuario }: { nomeUsuario?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // LGPD (direito de portabilidade): monta um arquivo com os dados que o
  // próprio inquilino já enxerga no painel (perfil, locação, boletos,
  // documentos) — tudo já filtrado pelo RLS, nenhuma rota nova necessária.
  async function handleBaixarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('profiles')
      .select('nome, email, telefone, cpf, criado_em')
      .eq('id', user.id)
      .single()

    const { data: locacoes } = await supabase
      .from('locacoes')
      .select('id, data_inicio, data_fim, valor, dia_vencimento, status, imoveis(endereco, numero, bairro, cidade, uf)')
      .eq('inquilino_id', user.id)

    const locacaoAtivaId = locacoes?.find((l: any) => l.status === 'ativa')?.id ?? null

    const [{ data: boletos }, { data: documentos }] = await Promise.all([
      locacaoAtivaId
        ? supabase.from('boletos').select('mes_referencia, vencimento, valor, status, pago_em').eq('locacao_id', locacaoAtivaId)
        : Promise.resolve({ data: [] }),
      locacaoAtivaId
        ? supabase.from('documentos').select('nome_arquivo, tipo, criado_em').eq('locacao_id', locacaoAtivaId)
        : Promise.resolve({ data: [] }),
    ])

    const dados = {
      exportado_em: new Date().toISOString(),
      perfil,
      locacoes,
      boletos,
      documentos,
    }

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meus-dados.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Desktop: sidebar lateral fixa */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-gray-900">Locadora</span>
        </div>
        {nomeUsuario && (
          <div className="border-b border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-500">Bem-vindo(a),</p>
            <p className="text-sm font-medium text-gray-900 truncate">{nomeUsuario}</p>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5 px-3">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    {active && <ChevronRight className="ml-auto h-3 w-3" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-gray-100 p-3 space-y-0.5">
          <button
            onClick={handleBaixarDados}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <Download className="h-4 w-4" />
            Baixar meus dados
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile: barra superior + navegação inferior fixa */}
      <header className="flex md:hidden h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-gray-900 text-sm">Locadora</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleBaixarDados} aria-label="Baixar meus dados" className="text-gray-500">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={handleLogout} aria-label="Sair" className="text-gray-500">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                active ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
