import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface EnderecoViaCep {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

// Busca endereço a partir do CEP via ViaCEP (API pública, sem chave).
// Retorna null se o CEP for inválido/incompleto ou não for encontrado.
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep | null> {
  const digitos = cep.replace(/\D/g, '')
  if (digitos.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
    const data = await res.json()
    if (!res.ok || data.erro) return null
    return {
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      localidade: data.localidade ?? '',
      uf: data.uf ?? '',
    }
  } catch {
    return null
  }
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Inputs de valor monetário usam type="text" (não "number") porque o HTML5
// number input só aceita ponto como separador decimal — no formato brasileiro
// (vírgula), o navegador rejeita o caractere e parece que o campo "trava".
export function parseMoeda(value: string): number | null {
  let v = value.trim()
  if (!v) return null
  // Só trata "." como separador de milhar quando há vírgula decimal (ex: "1.500,50")
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(v)
  return isNaN(num) ? null : num
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return date
  }
}

export function formatDatetime(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return date
  }
}

export function formatMesReferencia(mes: string): string {
  const [ano, mesNum] = mes.split('-')
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${meses[parseInt(mesNum) - 1]}/${ano}`
}

export function tipoDocumentoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    contrato: 'Contrato',
    vistoria_entrada: 'Vistoria de Entrada',
    vistoria_saida: 'Vistoria de Saída',
    entrega_chaves: 'Entrega de Chaves',
    rg: 'RG',
    cpf: 'CPF',
    comprovante_renda: 'Comprovante de Renda',
    extrato: 'Extrato Bancário',
    'apólice': 'Apólice de Seguro',
    outro: 'Outro',
  }
  return labels[tipo] ?? tipo
}

export function tipoAgendamentoLabel(tipo: string) {
  const labels: Record<string, string> = {
    visita: 'Visita ao imóvel',
    entrega_chaves: 'Entrega de chaves',
    retirada_chaves: 'Retirada de chaves',
  }
  return labels[tipo] ?? tipo
}

export function statusAgendamentoColor(status: string) {
  const colors: Record<string, string> = {
    agendado: 'bg-blue-100 text-blue-800',
    realizado: 'bg-green-100 text-green-800',
    cancelado: 'bg-gray-100 text-gray-600',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}

export function statusAgendamentoLabel(status: string) {
  const labels: Record<string, string> = {
    agendado: 'Agendado',
    realizado: 'Realizado',
    cancelado: 'Cancelado',
  }
  return labels[status] ?? status
}

export function statusBoletoColor(status: string) {
  const colors: Record<string, string> = {
    em_aberto: 'bg-yellow-100 text-yellow-800',
    pago: 'bg-green-100 text-green-800',
    vencido: 'bg-red-100 text-red-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}

export function statusBoletoLabel(status: string) {
  const labels: Record<string, string> = {
    em_aberto: 'Em Aberto',
    pago: 'Pago',
    vencido: 'Vencido',
  }
  return labels[status] ?? status
}

export function statusImovelLabel(status: string) {
  const labels: Record<string, string> = {
    disponivel: 'Disponível',
    alugado: 'Alugado',
    em_analise: 'Em Análise',
  }
  return labels[status] ?? status
}

export function statusImovelColor(status: string) {
  const colors: Record<string, string> = {
    disponivel: 'bg-green-100 text-green-800',
    alugado: 'bg-blue-100 text-blue-800',
    em_analise: 'bg-yellow-100 text-yellow-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}

export function tipoImovelLabel(tipo: string) {
  const labels: Record<string, string> = {
    apartamento: 'Apartamento',
    casa: 'Casa',
    comercial: 'Comercial',
    sala: 'Sala',
    outro: 'Outro',
  }
  return labels[tipo] ?? tipo
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getInitials(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}
