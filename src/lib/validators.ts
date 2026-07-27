function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

function digitoVerificador(digitos: string, pesos: number[]): number {
  const soma = digitos.split('').reduce((acc, d, i) => acc + Number(d) * pesos[i], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function validarCPF(valor: string): boolean {
  const cpf = apenasDigitos(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const dv1 = digitoVerificador(cpf.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const dv2 = digitoVerificador(cpf.slice(0, 9) + dv1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return cpf === cpf.slice(0, 9) + String(dv1) + String(dv2)
}

export function validarCNPJ(valor: string): boolean {
  const cnpj = apenasDigitos(valor)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

  const dv1 = digitoVerificador(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const dv2 = digitoVerificador(cnpj.slice(0, 12) + dv1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return cnpj === cnpj.slice(0, 12) + String(dv1) + String(dv2)
}

export function validarCpfCnpj(valor: string): boolean {
  const digitos = apenasDigitos(valor)
  if (digitos.length === 11) return validarCPF(digitos)
  if (digitos.length === 14) return validarCNPJ(digitos)
  return false
}
