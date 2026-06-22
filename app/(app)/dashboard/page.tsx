export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Users, Shield, RefreshCw, Building2, AlertCircle, HandCoins, Archive, ArchiveRestore, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency, NOMES_MESES } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const [
    { data: usuario },
    { count: totalClientes },
    { count: totalApolices },
    { data: renovacoesMes },
    { data: alertas },
    { data: statusRows },
  ] = await Promise.all([
    supabase.from('usuarios').select('nome').eq('id', session.user.id).single(),
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase.from('apolices').select('*', { count: 'exact', head: true }),
    supabase.from('apolices')
      .select('*', { count: 'exact' })
      .gte('data_fim', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      .lte('data_fim', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]),
    supabase.from('apolices')
      .select('*, cliente:clientes(segurado), seguradora:seguradoras(nome)')
      .gte('data_fim', new Date().toISOString().split('T')[0])
      .lte('data_fim', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
      .order('data_fim', { ascending: true })
      .limit(3),
    supabase.from('status_renovacao').select('apolice_id, status').order('criado_em', { ascending: false }),
  ])

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Corretor'

  const hojeData = new Date()
  const mesAnteriorIdx = hojeData.getMonth() === 0 ? 11 : hojeData.getMonth() - 1
  const anoMesAnterior = hojeData.getMonth() === 0 ? hojeData.getFullYear() - 1 : hojeData.getFullYear()
  const inicioMesAnterior = `${anoMesAnterior}-${String(mesAnteriorIdx + 1).padStart(2, '0')}-01`
  const ultimoDiaMesAnterior = new Date(anoMesAnterior, mesAnteriorIdx + 1, 0).getDate()
  const fimMesAnterior = `${anoMesAnterior}-${String(mesAnteriorIdx + 1).padStart(2, '0')}-${String(ultimoDiaMesAnterior).padStart(2, '0')}`

  const { data: apolicesMesAnterior } = await supabase
    .from('apolices')
    .select('id, premio_liquido, comissao_percentual')
    .gte('data_emissao', inicioMesAnterior)
    .lte('data_emissao', fimMesAnterior)

  const idsApolicesMesAnterior = apolicesMesAnterior?.map((a) => a.id) ?? []
  const { data: conciliacoesMesAnterior } = idsApolicesMesAnterior.length
    ? await supabase.from('conciliacao').select('apolice_id, valor_conciliar').in('apolice_id', idsApolicesMesAnterior)
    : { data: [] as { apolice_id: string; valor_conciliar: number }[] }

  const conciliadoPorApoliceAnterior = new Map<string, number>()
  conciliacoesMesAnterior?.forEach((c) => {
    conciliadoPorApoliceAnterior.set(c.apolice_id, (conciliadoPorApoliceAnterior.get(c.apolice_id) ?? 0) + Number(c.valor_conciliar))
  })

  const totalPendenteConciliacao = apolicesMesAnterior?.reduce((soma, a) => {
    const comissaoCalculada = a.premio_liquido * ((a.comissao_percentual ?? 0) / 100)
    const jaConciliado = conciliadoPorApoliceAnterior.get(a.id) ?? 0
    const restante = Math.round((comissaoCalculada - jaConciliado) * 100) / 100
    return soma + (restante > 0 ? restante : 0)
  }, 0) ?? 0

  const statusFinalPorApolice = new Map<string, string>()
  statusRows?.forEach((s) => {
    if (!statusFinalPorApolice.has(s.apolice_id)) statusFinalPorApolice.set(s.apolice_id, s.status)
  })
  const pendentesHistorico = Array.from(statusFinalPorApolice.values()).filter(
    (s) => s === 'Renovada' || s === 'Cancelada'
  ).length

  const stats = [
    { label: 'Total de Clientes', value: totalClientes ?? 0, icon: Users, href: '/clientes' },
    { label: 'Apólices Ativas', value: totalApolices ?? 0, icon: Shield, href: '/apolices' },
    { label: 'Renovações no Mês', value: renovacoesMes?.length ?? 0, icon: RefreshCw, href: '/renovacoes' },
  ]

  const quickLinks = [
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/apolices', label: 'Apólices', icon: Shield },
    { href: '/renovacoes', label: 'Renovações', icon: RefreshCw },
    { href: '/seguradoras', label: 'Seguradoras', icon: Building2 },
    { href: '/conciliacao', label: 'Conciliação', icon: HandCoins },
    { href: '/historico-renovacao', label: 'Histórico', icon: Archive },
  ]

  return (
    <div className="space-y-8">
      <div>
        <p className="text-body-sm text-on-surface-variant">Bem-vindo de volta</p>
        <h1 className="text-h1 text-on-surface">Olá, {primeiroNome}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-overlay transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="label-caps text-on-surface-variant">{label}</p>
                  <p className="text-2xl font-bold text-on-surface">{value.toLocaleString('pt-BR')}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-h3 text-on-surface mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Card className="hover:shadow-overlay transition-shadow cursor-pointer p-4 flex flex-col items-center gap-2 text-center">
                  <Icon className="w-6 h-6 text-secondary" />
                  <span className="text-body-sm font-medium text-on-surface">{label}</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-h3 text-on-surface mb-4">Alertas Urgentes</h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              {pendentesHistorico > 0 && (
                <Link href="/renovacoes" className="block">
                  <div className="flex items-start gap-3 p-3 rounded bg-amber-50 border-2 border-amber-400 animate-pulse hover:animate-none hover:bg-amber-100 transition-colors">
                    <ArchiveRestore className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body-sm font-bold text-on-surface">
                        ⚠ Existem {pendentesHistorico} renovaç{pendentesHistorico === 1 ? 'ão' : 'ões'} com status de Renovada ou Cancelada
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        Você pode enviá-la{pendentesHistorico === 1 ? '' : 's'} para o histórico. Clique para ir até Renovações.
                      </p>
                    </div>
                  </div>
                </Link>
              )}
              {totalPendenteConciliacao > 0 && (
                <Link href={`/conciliacao?mes=${mesAnteriorIdx + 1}&ano=${anoMesAnterior}`} className="block">
                  <div className="flex items-start gap-3 p-3 rounded bg-amber-50 border-2 border-amber-400 hover:bg-amber-100 transition-colors">
                    <Wallet className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body-sm font-bold text-on-surface">
                        Existem comissões para o mês anterior ({NOMES_MESES[mesAnteriorIdx]}) que ainda não foram conciliadas.
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        Total a conciliar: {formatCurrency(totalPendenteConciliacao)}. Clique para ir até Conciliação.
                      </p>
                    </div>
                  </div>
                </Link>
              )}
              {alertas && alertas.length > 0 ? (
                alertas.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded bg-error/5 border border-error/10">
                    <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body-sm font-medium text-on-surface">Apólice Vencendo</p>
                      <p className="text-body-sm text-on-surface-variant">
                        {a.cliente?.segurado} — {formatDate(a.data_fim)}
                      </p>
                    </div>
                  </div>
                ))
              ) : pendentesHistorico === 0 && totalPendenteConciliacao === 0 ? (
                <p className="text-body-sm text-on-surface-variant text-center py-4">
                  Nenhum alerta urgente
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
