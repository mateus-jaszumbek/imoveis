import type { SecaoFuncionario } from '@/lib/types'

// Mesma lista de rotas do menu em src/components/layout/sidebar-admin.tsx —
// usada pelo proxy (src/proxy.ts) para saber a que seção uma rota pertence.
// secao: null = sempre liberada para qualquer papel dentro de /admin.
// Rota ausente desta lista (ex: /admin/funcionarios, /admin/configuracoes,
// /admin/assinatura) = exclusiva do ADM.
const ROTAS_POR_SECAO: { href: string; secao: SecaoFuncionario | null }[] = [
  { href: '/admin/dashboard', secao: null },
  { href: '/admin/financeiro', secao: 'financeiro' },
  { href: '/admin/imoveis', secao: 'imoveis' },
  { href: '/admin/inquilinos', secao: 'inquilinos' },
  { href: '/admin/proprietarios', secao: 'proprietarios' },
  { href: '/admin/locacoes', secao: 'locacoes' },
  { href: '/admin/agenda', secao: 'agenda' },
  { href: '/admin/boletos', secao: 'boletos' },
  { href: '/admin/documentos', secao: 'documentos' },
  { href: '/admin/mensagens', secao: 'mensagens' },
  { href: '/admin/ajuda', secao: null },
]

// undefined = rota exclusiva do ADM (não está na lista acima)
export function secaoDoPathname(pathname: string): SecaoFuncionario | null | undefined {
  const rota = ROTAS_POR_SECAO.find(r => pathname === r.href || pathname.startsWith(r.href + '/'))
  return rota?.secao
}
