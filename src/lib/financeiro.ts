import { tipoImovelLabel } from '@/lib/utils'

export interface BoletoFinanceiro {
  id: string
  valor: number
  pago_em: string | null
  locacoes: {
    imoveis: {
      id: string
      codigo: string | null
      endereco: string
      tipo: string
      bairro: string | null
      cidade: string
      uf: string
      proprietario_id: string | null
      taxa_administracao_pct: number
    } | null
  } | null
}

export interface DespesaFinanceira {
  id: string
  valor: number
  data: string
  imovel_id: string | null
  imoveis: {
    id: string
    codigo: string | null
    endereco: string
    tipo: string
    bairro: string | null
    cidade: string
    uf: string
    proprietario_id: string | null
    taxa_administracao_pct: number
  } | null
}

export interface PontoMensal {
  mes: string
  mesLabel: string
  faturamento: number
  despesas: number
  lucro: number
  qtdBoletos: number
}

export interface ImovelAgregado {
  imovelId: string
  codigo: string | null
  endereco: string
  tipo: string
  cidade: string
  uf: string
  proprietarioId: string | null
  ehProprio: boolean
  faturamento: number
  despesas: number
  comissao: number
  /** Resultado da imobiliária neste imóvel: lucro total se for próprio, ou só a comissão se for de terceiro. */
  lucro: number
  /** Valor a repassar ao proprietário (faturamento - despesas - comissão). Só se aplica a imóveis de terceiro. */
  repasse: number | null
}

export interface TipoAgregado {
  tipo: string
  tipoLabel: string
  faturamento: number
  despesas: number
  lucro: number
  margem: number
}

export interface RegiaoAgregada {
  cidade: string
  faturamento: number
  despesas: number
  lucro: number
  margem: number
}

export interface PontoRepasse {
  mes: string
  mesLabel: string
  aluguelRecebido: number
  despesas: number
  comissao: number
  repasseLiquido: number
}

const MESES_LABEL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function chaveMes(data: string): string {
  return data.slice(0, 7) // 'YYYY-MM'
}

export function ultimosNMeses(n: number, referencia = new Date()): { chave: string; label: string }[] {
  const meses: { chave: string; label: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    meses.push({ chave, label: `${MESES_LABEL[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` })
  }
  return meses
}

/**
 * Faturamento/despesas/lucro sob a ótica da IMOBILIÁRIA: para imóvel de
 * terceiro (proprietario_id definido) só a comissão entra como receita e as
 * despesas do imóvel não contam (elas abatem o repasse do proprietário, não
 * o resultado da imobiliária). Para imóvel próprio, vale o valor cheio.
 */
export function aggregarPorMes(boletos: BoletoFinanceiro[], despesas: DespesaFinanceira[], n = 12): PontoMensal[] {
  const meses = ultimosNMeses(n)
  const porMes = new Map<string, PontoMensal>(
    meses.map(({ chave, label }) => [chave, { mes: chave, mesLabel: label, faturamento: 0, despesas: 0, lucro: 0, qtdBoletos: 0 }])
  )

  for (const b of boletos) {
    if (!b.pago_em) continue
    const chave = chaveMes(b.pago_em)
    const ponto = porMes.get(chave)
    if (!ponto) continue
    const imovel = b.locacoes?.imoveis
    const valor = Number(b.valor)
    if (imovel?.proprietario_id) {
      ponto.faturamento += valor * (Number(imovel.taxa_administracao_pct) / 100)
    } else {
      ponto.faturamento += valor
    }
    ponto.qtdBoletos += 1
  }

  for (const d of despesas) {
    const chave = chaveMes(d.data)
    const ponto = porMes.get(chave)
    if (!ponto) continue
    // Despesa de imóvel de terceiro sai do repasse do proprietário, não do caixa da imobiliária.
    if (d.imoveis?.proprietario_id) continue
    ponto.despesas += Number(d.valor)
  }

  const pontos = Array.from(porMes.values())
  pontos.forEach(p => { p.lucro = p.faturamento - p.despesas })
  return pontos
}

export function aggregarPorImovel(boletos: BoletoFinanceiro[], despesas: DespesaFinanceira[]): ImovelAgregado[] {
  const porImovel = new Map<string, ImovelAgregado>()

  function garantir(imovel: { id: string; codigo: string | null; endereco: string; tipo: string; cidade: string; uf: string; proprietario_id: string | null; taxa_administracao_pct: number }) {
    let item = porImovel.get(imovel.id)
    if (!item) {
      item = {
        imovelId: imovel.id,
        codigo: imovel.codigo,
        endereco: imovel.endereco,
        tipo: imovel.tipo,
        cidade: imovel.cidade,
        uf: imovel.uf,
        proprietarioId: imovel.proprietario_id,
        ehProprio: !imovel.proprietario_id,
        faturamento: 0,
        despesas: 0,
        comissao: 0,
        lucro: 0,
        repasse: null,
      }
      porImovel.set(imovel.id, item)
    }
    return item
  }

  for (const b of boletos) {
    const imovel = b.locacoes?.imoveis
    if (!imovel || !b.pago_em) continue
    const item = garantir(imovel)
    const valor = Number(b.valor)
    item.faturamento += valor
    if (item.proprietarioId) item.comissao += valor * (Number(imovel.taxa_administracao_pct) / 100)
  }

  for (const d of despesas) {
    if (!d.imoveis) continue
    garantir(d.imoveis).despesas += Number(d.valor)
  }

  const lista = Array.from(porImovel.values())
  lista.forEach(i => {
    if (i.ehProprio) {
      i.lucro = i.faturamento - i.despesas
      i.repasse = null
    } else {
      i.lucro = i.comissao
      i.repasse = i.faturamento - i.despesas - i.comissao
    }
  })
  return lista.sort((a, b) => b.lucro - a.lucro)
}

export function aggregarPorTipo(imoveis: ImovelAgregado[]): TipoAgregado[] {
  const porTipo = new Map<string, TipoAgregado>()
  for (const i of imoveis) {
    let item = porTipo.get(i.tipo)
    if (!item) {
      item = { tipo: i.tipo, tipoLabel: tipoImovelLabel(i.tipo), faturamento: 0, despesas: 0, lucro: 0, margem: 0 }
      porTipo.set(i.tipo, item)
    }
    item.faturamento += i.faturamento
    item.despesas += i.despesas
    item.lucro += i.lucro
  }
  const lista = Array.from(porTipo.values())
  lista.forEach(t => { t.margem = t.faturamento > 0 ? (t.lucro / t.faturamento) * 100 : 0 })
  return lista.sort((a, b) => b.faturamento - a.faturamento)
}

export function aggregarPorRegiao(imoveis: ImovelAgregado[]): RegiaoAgregada[] {
  const porCidade = new Map<string, RegiaoAgregada>()
  for (const i of imoveis) {
    const chave = `${i.cidade}/${i.uf}`
    let item = porCidade.get(chave)
    if (!item) {
      item = { cidade: chave, faturamento: 0, despesas: 0, lucro: 0, margem: 0 }
      porCidade.set(chave, item)
    }
    item.faturamento += i.faturamento
    item.despesas += i.despesas
    item.lucro += i.lucro
  }
  const lista = Array.from(porCidade.values())
  lista.forEach(r => { r.margem = r.faturamento > 0 ? (r.lucro / r.faturamento) * 100 : 0 })
  return lista.sort((a, b) => b.lucro - a.lucro)
}

/**
 * Extrato mensal sob a ótica do PROPRIETÁRIO: considera só os imóveis dele,
 * com TODAS as despesas do imóvel abatidas (diferente da ótica da
 * imobiliária) e a comissão de administração destacada à parte.
 */
export function aggregarRepassePorProprietario(
  boletos: BoletoFinanceiro[],
  despesas: DespesaFinanceira[],
  proprietarioId: string,
  n = 12
): PontoRepasse[] {
  const meses = ultimosNMeses(n)
  const porMes = new Map<string, PontoRepasse>(
    meses.map(({ chave, label }) => [chave, { mes: chave, mesLabel: label, aluguelRecebido: 0, despesas: 0, comissao: 0, repasseLiquido: 0 }])
  )

  for (const b of boletos) {
    const imovel = b.locacoes?.imoveis
    if (!imovel || !b.pago_em || imovel.proprietario_id !== proprietarioId) continue
    const ponto = porMes.get(chaveMes(b.pago_em))
    if (!ponto) continue
    const valor = Number(b.valor)
    ponto.aluguelRecebido += valor
    ponto.comissao += valor * (Number(imovel.taxa_administracao_pct) / 100)
  }

  for (const d of despesas) {
    if (!d.imoveis || d.imoveis.proprietario_id !== proprietarioId) continue
    const ponto = porMes.get(chaveMes(d.data))
    if (!ponto) continue
    ponto.despesas += Number(d.valor)
  }

  const pontos = Array.from(porMes.values())
  pontos.forEach(p => { p.repasseLiquido = p.aluguelRecebido - p.despesas - p.comissao })
  return pontos
}
