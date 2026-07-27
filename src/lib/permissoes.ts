import type { SecaoFuncionario } from '@/lib/types'

// secao -> pode_editar (a ausência da chave = seção não liberada para o funcionário)
export type MapaPermissoes = Partial<Record<SecaoFuncionario, boolean>>

export async function buscarPermissoesFuncionario(
  supabase: { from: (table: string) => any },
  profileId: string
): Promise<MapaPermissoes> {
  const { data } = await supabase
    .from('funcionario_permissoes')
    .select('secao, pode_editar')
    .eq('profile_id', profileId)

  const mapa: MapaPermissoes = {}
  for (const row of data ?? []) {
    mapa[row.secao as SecaoFuncionario] = row.pode_editar
  }
  return mapa
}

// Usado nas rotas de API que hoje só aceitam role === 'admin' (criar/editar
// inquilino ou proprietário) — libera também o funcionário com pode_editar=true
// na seção correspondente, sem nunca deixar um funcionário criar outro
// funcionário ou mexer na própria permissão (isso continua exclusivo do ADM).
export async function podeGerenciarSecao(
  supabase: { from: (table: string) => any },
  profileId: string,
  role: string | undefined,
  secao: SecaoFuncionario
): Promise<boolean> {
  if (role === 'admin') return true
  if (role !== 'funcionario') return false
  const { data } = await supabase
    .from('funcionario_permissoes')
    .select('pode_editar')
    .eq('profile_id', profileId)
    .eq('secao', secao)
    .maybeSingle()
  return data?.pode_editar === true
}
