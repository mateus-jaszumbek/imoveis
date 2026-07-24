import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarCliente } from '@/components/layout/sidebar-cliente'

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // O papel já foi validado pelo proxy (src/proxy.ts) — não repetir o
  // redirecionamento por papel aqui (duas fontes de verdade independentes
  // já causaram loop de redirecionamento em produção quando discordaram).
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <SidebarCliente nomeUsuario={profile?.nome} />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 pb-20 md:p-6 md:pb-6 max-w-3xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
