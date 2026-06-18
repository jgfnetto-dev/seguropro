import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(date: string) {
  if (!date) return ''
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export const RAMOS_SEGURO = ['Auto', 'Moto', 'Vida', 'Residencial', 'Empresarial', 'Saúde', 'Dental', 'Rural', 'Frotas', 'Previdência', 'Outros']

export const TIPOS_SEGURO = ['Automóvel', 'Moto', 'Vida', 'Residencial', 'Empresarial', 'Saúde', 'Dental', 'Rural', 'Frota', 'Previdência', 'Outros']

export const MESES = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

export function anosDisponiveis() {
  const anoAtual = new Date().getFullYear()
  const anos: number[] = []
  for (let ano = anoAtual + 1; ano >= anoAtual - 5; ano--) anos.push(ano)
  return anos
}
