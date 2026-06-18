export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, MESES, anosDisponiveis } from '@/lib/utils'
import { DeleteApoliceButton } from './delete-button'

export default async function ApolicesPage({ searchParams }: { searchParams: { q?: string; mes?: string; ano?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  let query = supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado), seguradora:seguradoras(nome)')
    .order('data_fim', { ascending: true })

  if (searchParams.q) {
    query = query.or(`numero_apolice.ilike.%${searchParams.q}%`)
  }

  if (searchParams.mes && searchParams.ano) {
    const mes = parseInt(searchParams.mes)
    const ano = parseInt(searchParams.ano)
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
    query = query.gte('data_emissao', inicio).lte('data_emissao', fim)
  }

  const [{ data: apolices }, { data: todasApolices }] = await Promise.all([
    query,
    supabase.from('apolices').select('cliente_id'),
  ])

  const contagemPorCliente = new Map<string, number>()
  todasApolices?.forEach((a) => {
    contagemPorCliente.set(a.cliente_id, (contagemPorCliente.get(a.cliente_id) ?? 0) + 1)
  })

  function getStatusBadge(dataFim: string) {
    const hoje = new Date()
    const fim = new Date(dataFim)
    const diff = (fim.getTime() - hoje.getTime()) / 86400000
    if (diff < 0) return <Badge variant="destructive">Vencida</Badge>
    if (diff <= 30) return <Badge variant="warning">Vence em breve</Badge>
    return <Badge variant="success">Ativa</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-on-surface">Apólices</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Gerencie todas as apólices cadastradas.</p>
        </div>
        <Link href="/apolices/novo">
          <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Apólice</Button>
        </Link>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por número de apólice..."
            className="w-full h-10 pl-10 pr-4 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          name="mes"
          defaultValue={searchParams.mes ?? ''}
          className="h-10 px-3 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Mês de emissão</option>
          {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select
          name="ano"
          defaultValue={searchParams.ano ?? ''}
          className="h-10 px-3 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Ano</option>
          {anosDisponiveis().map((ano) => <option key={ano} value={ano}>{ano}</option>)}
        </select>
        <Button type="submit" variant="outline">Filtrar</Button>
        {(searchParams.mes || searchParams.ano) && (
          <Link href="/apolices"><Button type="button" variant="ghost">Limpar filtro</Button></Link>
        )}
      </form>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Nº Apólice</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Cliente</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Tipo</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Seguradora</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Vendedor</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Prêmio Total</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Vencimento</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Status</th>
              <th className="label-caps text-on-surface-variant text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {apolices?.map((a, i: number) => (
              <tr key={a.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/40'}`}>
                <td className="px-4 py-3">
                  <Link href={`/apolices/${a.id}`} className="text-body-sm font-medium text-secondary hover:underline">
                    {a.numero_apolice}
                  </Link>
                </td>
                <td className="px-4 py-3 text-body-sm text-on-surface">{a.cliente?.segurado}</td>
                <td className="px-4 py-3 text-body-sm text-on-surface-variant">{a.tipo_seguro}</td>
                <td className="px-4 py-3 text-body-sm text-on-surface-variant">{a.seguradora?.nome}</td>
                <td className="px-4 py-3 text-body-sm text-on-surface-variant">{a.vendedor || '—'}</td>
                <td className="px-4 py-3 text-body-sm text-on-surface">{formatCurrency(a.premio_total)}</td>
                <td className="px-4 py-3 text-body-sm text-on-surface">{formatDate(a.data_fim)}</td>
                <td className="px-4 py-3">{getStatusBadge(a.data_fim)}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteApoliceButton
                    id={a.id}
                    numeroApolice={a.numero_apolice}
                    clienteNome={a.cliente?.segurado ?? ''}
                    isUltimaApoliceDoCliente={(contagemPorCliente.get(a.cliente_id) ?? 0) <= 1}
                  />
                </td>
              </tr>
            ))}
            {!apolices?.length && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-body-sm text-on-surface-variant">
                  Nenhuma apólice cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {apolices && apolices.length > 0 && (
          <div className="px-4 py-3 border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
            Exibindo {apolices.length} apólice{apolices.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </div>
  )
}
