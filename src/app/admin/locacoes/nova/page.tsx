import { createClient } from '@/lib/supabase/server'
import { LocacaoForm } from '@/components/locacoes/locacao-form'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NovaLocacaoPage() {
  const supabase = await createClient()
  const [{ data: imoveis }, { data: inquilinos }] = await Promise.all([
    supabase.from('imoveis').select('id, endereco, numero, cidade').eq('status', 'disponivel').order('endereco'),
    supabase.from('profiles').select('id, nome, email').eq('role', 'cliente').order('nome'),
  ])

  return (
    <div>
      <Link href="/admin/locacoes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>
      <PageHeader title="Nova Locação" description="Vincule um inquilino a um imóvel" />
      <LocacaoForm imoveis={imoveis ?? []} inquilinos={inquilinos ?? []} />
    </div>
  )
}
