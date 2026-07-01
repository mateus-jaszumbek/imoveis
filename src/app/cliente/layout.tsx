import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarCliente } from '@/components/layout/sidebar-cliente'

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin/dashboard')

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
