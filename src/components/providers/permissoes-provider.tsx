'use client'
import { createContext, useContext } from 'react'
import type { SecaoFuncionario } from '@/lib/types'
import type { MapaPermissoes } from '@/lib/permissoes'

interface PermissoesContextValue {
  isAdmin: boolean
  podeVer: (secao: SecaoFuncionario) => boolean
  podeEditar: (secao: SecaoFuncionario) => boolean
}

const PermissoesContext = createContext<PermissoesContextValue | null>(null)

export function PermissoesProvider({
  isAdmin,
  permissoes,
  children,
}: {
  isAdmin: boolean
  permissoes: MapaPermissoes
  children: React.ReactNode
}) {
  const value: PermissoesContextValue = {
    isAdmin,
    podeVer: (secao) => isAdmin || secao in permissoes,
    podeEditar: (secao) => isAdmin || permissoes[secao] === true,
  }
  return <PermissoesContext.Provider value={value}>{children}</PermissoesContext.Provider>
}

export function usePermissoes() {
  const ctx = useContext(PermissoesContext)
  if (!ctx) throw new Error('usePermissoes must be used inside PermissoesProvider')
  return ctx
}
