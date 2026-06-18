export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import { HistoricoRow } from './historico-row'
import type { HistoricoRenovacao } from '@/types'

export default async function HistoricoRenovacaoPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: todosRegistros } = await supabase
    .from('historico_renovacao')
    .select('*')
    .order('arquivado_em', { ascending: false })

  const termo = searchParams.q?.toLowerCase().trim()
  const registros = termo
    ? (todosRegistros as HistoricoRenovacao[] | null)?.filter((h) =>
        h.numero_apolice.toLowerCase().includes(termo) || (h.cliente?.segurado ?? '').toLowerCase().includes(termo)
      )
    : todosRegistros

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-on-surface">Histórico de Renovações</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">Consulte as apólices renovadas ou canceladas que foram arquivadas.</p>
      </div>

      <form method="GET" className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Buscar por apólice ou cliente..."
          className="w-full h-10 pl-10 pr-4 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </form>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="label-caps text-on-surface-variant text-left px-2 py-3 w-8"></th>
              <th className="label-caps text-on-surface-variant text-left px-3 py-3">Apólice</th>
              <th className="label-caps text-on-surface-variant text-left px-3 py-3">Cliente</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3">CPF/CNPJ</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3">Seguradora</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3">Tipo</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3">Venceu em</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3">Status</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-3">Arquivado em</th>
              <th className="label-caps text-on-surface-variant text-right px-2 py-3">PDF</th>
            </tr>
          </thead>
          <tbody>
            {(registros as HistoricoRenovacao[] | null)?.map((h, i) => (
              <HistoricoRow key={h.id} registro={h} index={i} />
            ))}
            {!registros?.length && (
              <tr>
                <td colSpan={10} className="text-center py-12 text-body-sm text-on-surface-variant">
                  Nenhum registro no histórico
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {registros && registros.length > 0 && (
          <div className="px-3 py-3 border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
            Exibindo {registros.length} registro{registros.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </div>
  )
}
