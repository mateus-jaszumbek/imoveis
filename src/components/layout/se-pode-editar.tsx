'use client'
import { usePermissoes } from '@/components/providers/permissoes-provider'
import type { SecaoFuncionario } from '@/lib/types'

// Esconde botões/links de adicionar/editar quando o funcionário só tem
// permissão de visualizar naquela seção. Funciona dentro de Server
// Components — recebe o botão/link já pronto como children.
export function SePodeEditar({ secao, children }: { secao: SecaoFuncionario; children: React.ReactNode }) {
  const { podeEditar } = usePermissoes()
  if (!podeEditar(secao)) return null
  return <>{children}</>
}
