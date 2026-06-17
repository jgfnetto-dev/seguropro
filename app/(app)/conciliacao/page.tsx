export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { formatDate, formatCurrency, formatCpfCnpj } from '@/lib/utils'
import { ConciliarButton } from './conciliar-button'

export default async function ConciliacaoPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  let query = supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado, cpf_cnpj)')
    .order('data_fim', { ascending: true })

  if (searchParams.q) {
    query = query.or(`numero_apolice.ilike.%${searchParams.q}%`)
  }

  const [{ data: apolices }, { data: conciliacoes }] = await Promise.all([
    query,
    supabase.from('conciliacao').select('apolice_id, valor_conciliar'),
  ])

  const conciliadoPorApolice = new Map<string, number>()
  conciliacoes?.forEach((c) => {
    conciliadoPorApolice.set(c.apolice_id, (conciliadoPorApolice.get(c.apolice_id) ?? 0) + Number(c.valor_conciliar))
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-on-surface">Conciliação</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">Acompanhe e concilie as comissões das apólices.</p>
      </div>

      <form method="GET" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Buscar por número de apólice..."
          className="w-full h-10 pl-10 pr-4 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Apólice</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">CPF/CNPJ</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Cliente</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Início</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Fim</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Tipo de Seguro</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Prêmio Líquido</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">% Comissão</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Comissão</th>
              <th className="label-caps text-on-surface-variant text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {apolices?.map((a, i: number) => {
              const comissaoCalculada = a.premio_liquido * ((a.comissao_percentual ?? 0) / 100)
              const jaConciliado = conciliadoPorApolice.get(a.id) ?? 0
              const comissaoRestante = comissaoCalculada - jaConciliado
              return (
                <tr key={a.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/40'}`}>
                  <td className="px-4 py-3 text-body-sm font-medium text-on-surface">{a.numero_apolice}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{a.cliente?.cpf_cnpj ? formatCpfCnpj(a.cliente.cpf_cnpj) : '—'}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface">{a.cliente?.segurado}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{formatDate(a.data_inicio)}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{formatDate(a.data_fim)}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{a.tipo_seguro}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface">{formatCurrency(a.premio_liquido)}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{a.comissao_percentual ?? 0}%</td>
                  <td className="px-4 py-3 text-body-sm font-medium text-on-surface">{formatCurrency(comissaoRestante)}</td>
                  <td className="px-4 py-3 text-right">
                    <ConciliarButton
                      apoliceId={a.id}
                      numeroApolice={a.numero_apolice}
                      clienteNome={a.cliente?.segurado ?? ''}
                      comissaoDisponivel={comissaoRestante}
                    />
                  </td>
                </tr>
              )
            })}
            {!apolices?.length && (
              <tr>
                <td colSpan={10} className="text-center py-12 text-body-sm text-on-surface-variant">
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
