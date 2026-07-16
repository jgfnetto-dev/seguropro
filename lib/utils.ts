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

export const RAMOS_SEGURO = ['Auto', 'Moto', 'Vida', 'Residencial', 'Empresarial', 'RC Obras']

export const TIPOS_SEGURO = ['Automóvel', 'Moto', 'Vida', 'Residencial', 'Empresarial', 'Saúde', 'Dental', 'Rural', 'Frota', 'Previdência', 'RC Obras', 'Outros']

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

export const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export const NOMES_MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const NOMES_DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

export function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Monta a grade de semanas (cada semana com 7 dias) cobrindo o mês inteiro,
// incluindo os dias do mês anterior/seguinte que completam a primeira/última semana.
export function getMonthGrid(ano: number, mes: number): Date[][] {
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)

  const inicio = new Date(primeiroDia)
  inicio.setDate(inicio.getDate() - inicio.getDay())

  const fim = new Date(ultimoDia)
  fim.setDate(fim.getDate() + (6 - fim.getDay()))

  const dias: Date[] = []
  for (const d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    dias.push(new Date(d))
  }

  const semanas: Date[][] = []
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7))
  return semanas
}

// Calcula a data e hora atuais sempre no horário de Brasília, independente do fuso
// horário configurado no servidor (importante para tarefas agendadas/lembretes,
// já que o usuário sempre informa a data/hora pensando no horário local do Brasil).
export function getAgoraBrasil() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())

  const mapa: Record<string, string> = {}
  partes.forEach((p) => { mapa[p.type] = p.value })

  return {
    dataKey: `${mapa.year}-${mapa.month}-${mapa.day}`,
    horaKey: `${mapa.hour}:${mapa.minute}:${mapa.second}`,
  }
}
