import { ProprietarioForm } from '@/components/proprietarios/proprietario-form'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NovoProprietarioPage() {
  return (
    <div>
      <Link href="/admin/proprietarios" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>
      <PageHeader title="Novo Proprietário" description="Cadastre e envie acesso ao proprietário" />
      <ProprietarioForm />
    </div>
  )
}
