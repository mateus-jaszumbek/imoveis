import { FuncionarioForm } from '@/components/funcionarios/funcionario-form'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NovoFuncionarioPage() {
  return (
    <div>
      <Link href="/admin/funcionarios" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Link>
      <PageHeader title="Novo Funcionário" description="Cadastre o acesso e escolha o que ele pode ver e editar" />
      <FuncionarioForm />
    </div>
  )
}
