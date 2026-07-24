'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Landmark, LogOut, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/proprietario/meus-imoveis', label: 'Meus Imóveis', icon: Building2 },
  { href: '/proprietario/repasses', label: 'Repasses', icon: Landmark },
]

export function SidebarProprietario({ nomeUsuario }: { nomeUsuario?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop: sidebar lateral fixa */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-gray-900">Locadora</span>
          <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">Proprietário</span>
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
        <div className="border-t border-gray-100 p-3">
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
        <button onClick={handleLogout} aria-label="Sair" className="text-gray-500">
          <LogOut className="h-4 w-4" />
        </button>
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
