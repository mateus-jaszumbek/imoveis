import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FuncionarioEditForm } from '@/components/funcionarios/funcionario-edit-form'
import { getInitials } from '@/lib/utils'

export default async function FuncionarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: funcionario } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'funcionario')
    .single()
  if (!funcionario) notFound()

  const { data: permissoes } = await supabase
    .from('funcionario_permissoes')
    .select('secao, pode_editar')
    .eq('profile_id', id)

  return (
    <div>
      <Link href="/admin/funcionarios" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg">
          {getInitials(funcionario.nome)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{funcionario.nome}</h1>
          <p className="text-sm text-gray-500">{funcionario.email}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <FuncionarioEditForm funcionario={funcionario} permissoesIniciais={permissoes ?? []} />
      </div>
    </div>
  )
}
