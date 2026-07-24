import { createClient } from '@/lib/supabase/server'
import { ImovelForm } from '@/components/imoveis/imovel-form'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NovoImovelPage() {
  const supabase = await createClient()
  const { data: proprietarios } = await supabase
    .from('profiles')
    .select('id, nome')
    .eq('role', 'proprietario')
    .order('nome')

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/imoveis" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4" />Voltar
        </Link>
        <PageHeader title="Novo Imóvel" description="Cadastre um novo imóvel na locadora" />
      </div>
      <ImovelForm proprietarios={proprietarios ?? []} />
    </div>
  )
}
