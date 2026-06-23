export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Plus, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MESES, anosDisponiveis } from '@/lib/utils'
import { ApoliceRow } from './apolice-row'

type SortField = 'cliente' | 'seguradora' | 'data_fim'

export default async function ApolicesPage({ searchParams }: { searchParams: { q?: string; mes?: string; ano?: string; sort?: string; dir?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const sort: SortField = searchParams.sort === 'cliente' || searchParams.sort === 'seguradora' ? searchParams.sort : 'data_fim'
  const dir: 'asc' | 'desc' = searchParams.dir === 'desc' ? 'desc' : 'asc'
  const ascending = dir === 'asc'

  let query = supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado, cpf_cnpj), seguradora:seguradoras(nome)')

  if (sort === 'data_fim') {
    query = query.order('data_fim', { ascending })
  }

  if (searchParams.q) {
    const termo = searchParams.q
    const { data: clientesMatch } = await supabase
      .from('clientes')
      .select('id')
      .ilike('segurado', `%${termo}%`)
    const clienteIds = clientesMatch?.map((c) => c.id) ?? []
    query = clienteIds.length
      ? query.or(`numero_apolice.ilike.%${termo}%,cliente_id.in.(${clienteIds.join(',')})`)
      : query.ilike('numero_apolice', `%${termo}%`)
  }

  if (searchParams.mes && searchParams.ano) {
    const mes = parseInt(searchParams.mes)
    const ano = parseInt(searchParams.ano)
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const fim = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
    query = query.gte('data_emissao', inicio).lte('data_emissao', fim)
  }

  const [{ data: apolices }, { data: todasApolices }, { data: endossos }] = await Promise.all([
    query,
    supabase.from('apolices').select('cliente_id'),
    supabase
      .from('endossos')
      .select('id, apolice_id, numero_endosso, tipo_endosso, segurado, data_emissao, data_inicio, data_fim, veiculo, ano, modelo, placa, chassi, pdf_url')
      .order('criado_em', { ascending: false }),
  ])

  if (sort === 'cliente' || sort === 'seguradora') {
    apolices?.sort((a, b) => {
      const valorA = sort === 'cliente' ? a.cliente?.segurado ?? '' : a.seguradora?.nome ?? ''
      const valorB = sort === 'cliente' ? b.cliente?.segurado ?? '' : b.seguradora?.nome ?? ''
      return ascending ? valorA.localeCompare(valorB, 'pt-BR') : valorB.localeCompare(valorA, 'pt-BR')
    })
  }

  const contagemPorCliente = new Map<string, number>()
  todasApolices?.forEach((a) => {
    contagemPorCliente.set(a.cliente_id, (contagemPorCliente.get(a.cliente_id) ?? 0) + 1)
  })

  const endossosPorApolice = new Map<string, NonNullable<typeof endossos>>()
  endossos?.forEach((e) => {
    const lista = endossosPorApolice.get(e.apolice_id) ?? []
    lista.push(e)
    endossosPorApolice.set(e.apolice_id, lista)
  })

  function getStatusBadge(dataFim: string) {
    const hoje = new Date()
    const fim = new Date(dataFim)
    const diff = (fim.getTime() - hoje.getTime()) / 86400000
    if (diff < 0) return <Badge variant="destructive">Vencida</Badge>
    if (diff <= 30) return <Badge variant="warning">Vence em breve</Badge>
    return <Badge variant="success">Ativa</Badge>
  }

  function sortHref(field: SortField) {
    const params = new URLSearchParams()
    if (searchParams.q) params.set('q', searchParams.q)
    if (searchParams.mes) params.set('mes', searchParams.mes)
    if (searchParams.ano) params.set('ano', searchParams.ano)
    params.set('sort', field)
    params.set('dir', sort === field && dir === 'asc' ? 'desc' : 'asc')
    return `/apolices?${params.toString()}`
  }

  function SortableHeader({ field, label }: { field: SortField; label: string }) {
    const active = sort === field
    return (
      <Link href={sortHref(field)} title="Ordenar" className="inline-flex items-center gap-1 hover:text-on-surface">
        {label}
        {active ? (
          dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </Link>
    )
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
            placeholder="Buscar por apólice ou cliente..."
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
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3 w-8"></th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3">Nº Apólice</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3"><SortableHeader field="cliente" label="Cliente" /></th>
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3">Emissão</th>
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3">Início</th>
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3">Tipo</th>
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3"><SortableHeader field="seguradora" label="Seguradora" /></th>
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3">Pr. Líquido</th>
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3">Pr. Total</th>
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3"><SortableHeader field="data_fim" label="Vencimento" /></th>
              <th className="label-caps text-on-surface-variant text-left px-1.5 py-3">Status</th>
              <th className="label-caps text-on-surface-variant text-right px-1.5 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {apolices?.map((a, i: number) => (
              <ApoliceRow
                key={a.id}
                apolice={a}
                index={i}
                isUltimaApoliceDoCliente={(contagemPorCliente.get(a.cliente_id) ?? 0) <= 1}
                endossos={endossosPorApolice.get(a.id) ?? []}
                statusBadge={getStatusBadge(a.data_fim)}
              />
            ))}
            {!apolices?.length && (
              <tr>
                <td colSpan={12} className="text-center py-12 text-body-sm text-on-surface-variant">
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
