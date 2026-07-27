'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2, Users, FileText, Receipt, MessageSquare,
  LayoutDashboard, LogOut, Home, ChevronRight, CalendarDays, Settings, DollarSign, Landmark, CreditCard, HelpCircle, Lock, UserCog
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { MapaPermissoes } from '@/lib/permissoes'
import type { SecaoFuncionario } from '@/lib/types'

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, secao: null },
  { href: '/admin/financeiro', label: 'Financeiro', icon: DollarSign, secao: 'financeiro' },
  { href: '/admin/imoveis', label: 'Imóveis', icon: Building2, secao: 'imoveis' },
  { href: '/admin/inquilinos', label: 'Inquilinos', icon: Users, secao: 'inquilinos' },
  { href: '/admin/proprietarios', label: 'Proprietários', icon: Landmark, secao: 'proprietarios' },
  { href: '/admin/locacoes', label: 'Locações', icon: Home, secao: 'locacoes' },
  { href: '/admin/agenda', label: 'Agenda', icon: CalendarDays, secao: 'agenda' },
  { href: '/admin/boletos', label: 'Boletos', icon: Receipt, secao: 'boletos' },
  { href: '/admin/documentos', label: 'Documentos', icon: FileText, secao: 'documentos' },
  { href: '/admin/mensagens', label: 'Mensagens', icon: MessageSquare, secao: 'mensagens' },
  { href: '/admin/ajuda', label: 'Ajuda', icon: HelpCircle, secao: null },
] as const

// Só o ADM vê e gerencia — nunca aparecem como seção configurável.
const linksAdminOnly = [
  { href: '/admin/funcionarios', label: 'Funcionários', icon: UserCog },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/admin/assinatura', label: 'Assinatura', icon: CreditCard },
]

export function SidebarAdmin({
  bloqueado = false,
  isAdmin = true,
  permissoes = {},
}: {
  bloqueado?: boolean
  isAdmin?: boolean
  permissoes?: MapaPermissoes
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const linksVisiveis = [
    ...links.filter(l => l.secao === null || isAdmin || (l.secao as SecaoFuncionario) in permissoes),
    ...(isAdmin ? linksAdminOnly : []),
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6">
        <Building2 className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-gray-900">Locadora</span>
        <span className="ml-auto rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">{isAdmin ? 'ADM' : 'Equipe'}</span>
      </div>
      {bloqueado && (
        <div className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Acesso bloqueado por falta de pagamento. Assine para liberar os módulos.
        </div>
      )}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-0.5 px-3">
          {linksVisiveis.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            const travado = bloqueado && href !== '/admin/assinatura'

            if (travado) {
              return (
                <li key={href}>
                  <span
                    title="Bloqueado — assine para acessar"
                    className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    <Lock className="ml-auto h-3 w-3" />
                  </span>
                </li>
              )
            }

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : bloqueado
                        ? 'text-blue-700 bg-blue-50/60 hover:bg-blue-50'
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
  )
}
