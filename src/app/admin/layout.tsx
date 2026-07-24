import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarAdmin } from '@/components/layout/sidebar-admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'proprietario') redirect('/proprietario/meus-imoveis')
  if (profile?.role !== 'admin') redirect('/cliente/meu-imovel')

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarAdmin />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
