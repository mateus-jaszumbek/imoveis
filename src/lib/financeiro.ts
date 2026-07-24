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
  faturamento: number
  despesas: number
  lucro: number
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
    ponto.faturamento += Number(b.valor)
    ponto.qtdBoletos += 1
  }

  for (const d of despesas) {
    const chave = chaveMes(d.data)
    const ponto = porMes.get(chave)
    if (!ponto) continue
    ponto.despesas += Number(d.valor)
  }

  const pontos = Array.from(porMes.values())
  pontos.forEach(p => { p.lucro = p.faturamento - p.despesas })
  return pontos
}

export function aggregarPorImovel(boletos: BoletoFinanceiro[], despesas: DespesaFinanceira[]): ImovelAgregado[] {
  const porImovel = new Map<string, ImovelAgregado>()

  function garantir(imovel: { id: string; codigo: string | null; endereco: string; tipo: string; cidade: string; uf: string }) {
    let item = porImovel.get(imovel.id)
    if (!item) {
      item = { imovelId: imovel.id, codigo: imovel.codigo, endereco: imovel.endereco, tipo: imovel.tipo, cidade: imovel.cidade, uf: imovel.uf, faturamento: 0, despesas: 0, lucro: 0 }
      porImovel.set(imovel.id, item)
    }
    return item
  }

  for (const b of boletos) {
    const imovel = b.locacoes?.imoveis
    if (!imovel || !b.pago_em) continue
    garantir(imovel).faturamento += Number(b.valor)
  }

  for (const d of despesas) {
    if (!d.imoveis) continue
    garantir(d.imoveis).despesas += Number(d.valor)
  }

  const lista = Array.from(porImovel.values())
  lista.forEach(i => { i.lucro = i.faturamento - i.despesas })
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
  }
  const lista = Array.from(porTipo.values())
  lista.forEach(t => { t.lucro = t.faturamento - t.despesas; t.margem = t.faturamento > 0 ? (t.lucro / t.faturamento) * 100 : 0 })
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
  }
  const lista = Array.from(porCidade.values())
  lista.forEach(r => { r.lucro = r.faturamento - r.despesas; r.margem = r.faturamento > 0 ? (r.lucro / r.faturamento) * 100 : 0 })
  return lista.sort((a, b) => b.lucro - a.lucro)
}
