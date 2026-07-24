// Códigos das séries do SGS (Sistema Gerenciador de Séries Temporais) do
// Banco Central — API pública, sem chave/autenticação.
// https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados
const CODIGOS_SGS: Record<'igpm' | 'ipca' | 'inpc', number> = {
  igpm: 189,
  ipca: 433,
  inpc: 188,
}

export const INDICES_LABEL: Record<'igpm' | 'ipca' | 'inpc', string> = {
  igpm: 'IGP-M',
  ipca: 'IPCA',
  inpc: 'INPC',
}

interface PontoSgs {
  data: string
  valor: string
}

/**
 * Busca a variação mensal dos últimos 12 meses no SGS do Banco Central e
 * retorna o percentual acumulado (juros compostos, não soma simples).
 */
export async function buscarVariacaoAcumulada12Meses(indice: 'igpm' | 'ipca' | 'inpc'): Promise<number> {
  const codigo = CODIGOS_SGS[indice]
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/12?formato=json`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Não foi possível consultar o índice no Banco Central agora. Tente novamente mais tarde.')
  const pontos: PontoSgs[] = await res.json()
  if (!pontos.length) throw new Error('O Banco Central não retornou dados para este índice.')

  const fatorAcumulado = pontos.reduce((fator, ponto) => {
    const mensal = parseFloat(ponto.valor.replace(',', '.'))
    return fator * (1 + mensal / 100)
  }, 1)

  return (fatorAcumulado - 1) * 100
}
