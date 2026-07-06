export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, CheckCircle2, Settings2 } from 'lucide-react'
import { formatDate, formatCurrency, formatCpfCnpj, MESES, anosDisponiveis } from '@/lib/utils'
import { ConciliarButton } from './conciliar-button'
import { HistoricoConciliacaoButton } from './historico-button'
import { VendedorButton } from './vendedor-button'
import { RelatorioConciliacaoButton } from './relatorio-button'

export default async function ConciliacaoPage({ searchParams }: { searchParams: { q?: string; mes?: string; ano?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  let query = supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado, cpf_cnpj)')
    .order('data_fim', { ascending: true })

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

  const [{ data: apolices }, { data: conciliacoes }] = await Promise.all([
    query,
    supabase
      .from('conciliacao')
      .select('id, apolice_id, data_conciliacao, valor_conciliar, comentario')
      .order('data_conciliacao', { ascending: false }),
  ])

  const conciliadoPorApolice = new Map<string, number>()
  const historicoPorApolice = new Map<string, { id: string; data_conciliacao: string; valor_conciliar: number; comentario?: string | null }[]>()
  conciliacoes?.forEach((c) => {
    conciliadoPorApolice.set(c.apolice_id, (conciliadoPorApolice.get(c.apolice_id) ?? 0) + Number(c.valor_conciliar))
    const lista = historicoPorApolice.get(c.apolice_id) ?? []
    lista.push(c)
    historicoPorApolice.set(c.apolice_id, lista)
  })

  const hojeConciliacao = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-on-surface">Conciliação</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Acompanhe e concilie as comissões das apólices.</p>
        </div>
        <RelatorioConciliacaoButton
          mesAtual={hojeConciliacao.getMonth() + 1}
          anoAtual={hojeConciliacao.getFullYear()}
          emailUsuario={session.user.email}
        />
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
          <Link href="/conciliacao"><Button type="button" variant="ghost">Limpar filtro</Button></Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-outline-variant/30 bg-card shadow-card">
        <table style={{ minWidth: '1700px', width: '100%' }}>
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="label-caps text-on-surface-variant text-left px-3 py-3 whitespace-nowrap">Apólice</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 whitespace-nowrap">CPF/CNPJ</th>
              <th className="label-caps text-on-surface-variant text-left px-3 py-3 whitespace-nowrap">Cliente</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 whitespace-nowrap">Emissão</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 whitespace-nowrap">Início</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 whitespace-nowrap">Fim</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 whitespace-nowrap">Tipo de Seguro</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 whitespace-nowrap">Vendedor</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 whitespace-nowrap">Prêmio Líquido</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 whitespace-nowrap">% Comissão</th>
              <th className="label-caps text-on-surface-variant text-left px-3 py-3 whitespace-nowrap">Comissão</th>
              <th className="text-on-surface-variant text-right px-3 py-3 whitespace-nowrap">
                <Settings2 className="w-4 h-4 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {apolices?.map((a, i: number) => {
              const comissaoCalculada = a.premio_liquido * ((a.comissao_percentual ?? 0) / 100)
              const jaConciliado = conciliadoPorApolice.get(a.id) ?? 0
              const comissaoRestante = Math.round((comissaoCalculada - jaConciliado) * 100) / 100
              const conciliado = comissaoRestante <= 0
              const historico = historicoPorApolice.get(a.id) ?? []
              return (
                <tr key={a.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/40'}`}>
                  <td className="px-3 py-3 text-body-sm font-medium text-on-surface">{a.numero_apolice}</td>
                  <td className="px-2 py-3 text-body-sm text-on-surface-variant">{a.cliente?.cpf_cnpj ? formatCpfCnpj(a.cliente.cpf_cnpj) : '—'}</td>
                  <td className="px-3 py-3 text-body-sm text-on-surface">{a.cliente?.segurado}</td>
                  <td className="px-2 py-3 text-body-sm text-on-surface-variant">{a.data_emissao ? formatDate(a.data_emissao) : '—'}</td>
                  <td className="px-2 py-3 text-body-sm text-on-surface-variant">{formatDate(a.data_inicio)}</td>
                  <td className="px-2 py-3 text-body-sm text-on-surface-variant">{formatDate(a.data_fim)}</td>
                  <td className="px-2 py-3 text-body-sm text-on-surface-variant">{a.tipo_seguro}</td>
                  <td className="px-2 py-3 text-body-sm text-on-surface-variant">
                    {a.vendedor ? <VendedorButton vendedor={a.vendedor} /> : '—'}
                  </td>
                  <td className="px-2 py-3 text-body-sm text-on-surface">{formatCurrency(a.premio_liquido)}</td>
                  <td className="px-2 py-3 text-body-sm text-on-surface-variant">{a.comissao_percentual ?? 0}%</td>
                  <td className="px-3 py-3">
                    {conciliado ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="success" className="gap-1 w-fit whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Conciliado
                        </Badge>
                        <span className="text-xs font-medium text-green-600">{formatCurrency(jaConciliado)}</span>
                      </div>
                    ) : (
                      <span className="text-body-sm font-medium text-on-surface">{formatCurrency(comissaoRestante)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {historico.length > 0 && (
                        <HistoricoConciliacaoButton numeroApolice={a.numero_apolice} historico={historico} />
                      )}
                      <ConciliarButton
                        apoliceId={a.id}
                        numeroApolice={a.numero_apolice}
                        clienteNome={a.cliente?.segurado ?? ''}
                        comissaoDisponivel={comissaoRestante}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
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
          <div className="px-3 py-3 border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
            Exibindo {apolices.length} apólice{apolices.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
