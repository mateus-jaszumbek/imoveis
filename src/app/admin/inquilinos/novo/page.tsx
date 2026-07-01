import { InquilinoForm } from '@/components/inquilinos/inquilino-form'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NovoInquilinoPage() {
  return (
    <div>
      <Link href="/admin/inquilinos" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>
      <PageHeader title="Novo Inquilino" description="Cadastre e envie acesso ao inquilino" />
      <InquilinoForm />
    </div>
  )
}
