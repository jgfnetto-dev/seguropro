export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EnviarWhatsappButton } from './enviar-whatsapp'
import { formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Download, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

function getMonthName(month: number) {
  return ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][month]
}

export default async function RenovacoesPage({ searchParams }: { searchParams: { mes?: string; ano?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()

  const hoje = new Date()
  const mes = searchParams.mes ? parseInt(searchParams.mes) : hoje.getMonth()
  const ano = searchParams.ano ? parseInt(searchParams.ano) : hoje.getFullYear()

  const inicio = new Date(ano, mes, 1).toISOString().split('T')[0]
  const fim = new Date(ano, mes + 1, 0).toISOString().split('T')[0]

  const { data: apolices } = await supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado, cpf_cnpj), seguradora:seguradoras(nome)')
    .eq('corretora_id', usuario?.corretora_id)
    .gte('data_fim', inicio)
    .lte('data_fim', fim)
    .order('data_fim', { ascending: true })

  const total = apolices?.length ?? 0
  const vencendo7 = apolices?.filter(a => {
    const diff = (new Date(a.data_fim).getTime() - hoje.getTime()) / 86400000
    return diff >= 0 && diff <= 7
  }).length ?? 0
  const renovadas = 0

  const prevMes = mes === 0 ? 11 : mes - 1
  const prevAno = mes === 0 ? ano - 1 : ano
  const nextMes = mes === 11 ? 0 : mes + 1
  const nextAno = mes === 11 ? ano + 1 : ano

  function getAvatarColor(nome: string) {
    const colors = ['bg-primary', 'bg-secondary', 'bg-green-600', 'bg-purple-600']
    return colors[nome.charCodeAt(0) % colors.length]
  }

  function getDaysUrgency(dataFim: string) {
    const diff = Math.ceil((new Date(dataFim).getTime() - hoje.getTime()) / 86400000)
    if (diff < 0) return { label: `Vencida há ${Math.abs(diff)} dias`, color: 'bg-error text-on-primary' }
    if (diff <= 2) return { label: `Vence em ${diff} dias`, color: 'bg-error text-on-primary' }
    if (diff <= 7) return { label: `Vence em ${diff} dias`, color: 'bg-yellow-500 text-white' }
    return null
  }

  const seguradoraColors: Record<string, string> = {}
  const colorPalette = ['bg-blue-500', 'bg-orange-400', 'bg-blue-800', 'bg-green-600']
  let colorIdx = 0
  apolices?.forEach((a) => {
    const nome = a.seguradora?.nome ?? ''
    if (!seguradoraColors[nome]) {
      seguradoraColors[nome] = colorPalette[colorIdx % colorPalette.length]
      colorIdx++
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-h1 text-on-surface">Controle de Renovações</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Gerencie as apólices que expiram em breve e mantenha sua carteira ativa.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="label-caps text-on-surface-variant">Mês de Referência</span>
          <div className="flex items-center gap-1 bg-card border border-outline-variant rounded-lg px-3 py-1.5">
            <Link href={`/renovacoes?mes=${prevMes}&ano=${prevAno}`}>
              <button className="p-0.5 hover:text-primary"><ChevronLeft className="w-4 h-4" /></button>
            </Link>
            <span className="font-semibold text-on-surface px-2">{getMonthName(mes)} {ano}</span>
            <Link href={`/renovacoes?mes=${nextMes}&ano=${nextAno}`}>
              <button className="p-0.5 hover:text-primary"><ChevronRight className="w-4 h-4" /></button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="label-caps text-on-surface-variant">Vencendo em 7 dias</p>
            <p className="text-3xl font-bold text-on-surface mt-1">{vencendo7}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">Ação prioritária recomendada para estes clientes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="label-caps text-on-surface-variant">Total do Mês</p>
            <p className="text-3xl font-bold text-on-surface mt-1">{total}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">Volume total de renovações agendadas para {getMonthName(mes)}.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="label-caps text-on-surface-variant">Renovadas (Taxa: {total > 0 ? Math.round((renovadas / total) * 100) : 0}%)</p>
            <p className="text-3xl font-bold text-on-surface mt-1">{renovadas}</p>
            <div className="w-full h-1.5 bg-surface-container rounded-full mt-2">
              <div
                className="h-1.5 bg-primary rounded-full"
                style={{ width: `${total > 0 ? (renovadas / total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-on-surface">Apólices em Aberto</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded hover:bg-surface-container text-on-surface-variant"><SlidersHorizontal className="w-4 h-4" /></button>
            <button className="p-2 rounded hover:bg-surface-container text-on-surface-variant"><Download className="w-4 h-4" /></button>
          </div>
        </div>

        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Cliente</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">CPF / CNPJ</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Nº Apólice</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Ramo</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Data Fim</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Seguradora</th>
                <th className="label-caps text-on-surface-variant text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {apolices?.map((a, i: number) => {
                const urgency = getDaysUrgency(a.data_fim)
                const initials = (a.cliente?.segurado ?? 'X').split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
                const color = getAvatarColor(a.cliente?.segurado ?? '')
                return (
                  <tr key={a.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/40'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-body-sm font-medium text-on-surface">{a.cliente?.segurado}</p>
                          {urgency && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${urgency.color}`}>
                              {urgency.label.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant">{a.cliente?.cpf_cnpj}</td>
                    <td className="px-4 py-3 text-body-sm text-on-surface">{a.numero_apolice}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{a.tipo_seguro}</Badge>
                    </td>
                    <td className={`px-4 py-3 text-body-sm font-medium ${urgency ? 'text-error' : 'text-on-surface'}`}>
                      {formatDate(a.data_fim)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-sm ${seguradoraColors[a.seguradora?.nome] ?? 'bg-gray-400'}`} />
                        <span className="text-body-sm text-on-surface-variant">{a.seguradora?.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant">▷</button>
                    </td>
                  </tr>
                )
              })}
              {!apolices?.length && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-body-sm text-on-surface-variant">
                    Nenhuma renovação para {getMonthName(mes)}/{ano}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {apolices && apolices.length > 0 && (
            <div className="px-4 py-3 border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
              Mostrando 1-{apolices.length} de {total} apólices
            </div>
          )}
        </Card>
      </div>

      {apolices && apolices.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <EnviarWhatsappButton apolices={apolices} mesNome={`${getMonthName(mes)}/${ano}`} />
        </div>
      )}
    </div>
  )
}
