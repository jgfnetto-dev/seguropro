export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Users, Shield, RefreshCw, Building2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

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
  ])

  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'Corretor'

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
              ) : (
                <p className="text-body-sm text-on-surface-variant text-center py-4">
                  Nenhum alerta urgente
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
