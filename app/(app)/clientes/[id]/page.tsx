export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClienteForm } from '../form'
import { formatDate } from '@/lib/utils'

export default async function ClientePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: cliente } = await supabase.from('clientes').select('*').eq('id', params.id).single()
  if (!cliente) notFound()

  const { data: apolices } = await supabase
    .from('apolices')
    .select('*, seguradora:seguradoras(nome)')
    .eq('cliente_id', params.id)
    .order('data_fim', { ascending: false })

  function getStatusBadge(dataFim: string) {
    const hoje = new Date()
    const fim = new Date(dataFim)
    const diff = (fim.getTime() - hoje.getTime()) / 86400000
    if (diff < 0) return <Badge variant="destructive">Vencida</Badge>
    if (diff <= 30) return <Badge variant="warning">Vence em breve</Badge>
    return <Badge variant="success">Ativa</Badge>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ClienteForm cliente={cliente} isEdit />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden h-40 bg-surface-container-high flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-body-sm italic text-on-surface-variant">
                &ldquo;A segurança do seu cliente começa com a precisão dos dados cadastrais.&rdquo;
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-4 flex gap-3">
            <span className="text-secondary mt-0.5">ℹ</span>
            <div>
              <p className="text-body-sm font-semibold text-on-surface">Atenção</p>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Certifique-se de que o CPF/CNPJ esteja correto para evitar erros no cálculo de bônus durante a cotação.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-on-surface">Apólices Vinculadas</h2>
          <Link href={`/apolices/novo?cliente_id=${cliente.id}`}>
            <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Nova Apólice</Button>
          </Link>
        </div>

        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Nº Apólice</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Ramo / Produto</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Seguradora</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Vencimento</th>
                <th className="label-caps text-on-surface-variant text-left px-4 py-3">Status</th>
                <th className="label-caps text-on-surface-variant text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {apolices?.map((a, i: number) => (
                <tr key={a.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/40'}`}>
                  <td className="px-4 py-3">
                    <span className="text-body-sm font-medium text-on-surface">{a.numero_apolice}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-body-sm font-medium text-on-surface">{a.tipo_seguro}</p>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{a.seguradora?.nome}</td>
                  <td className="px-4 py-3 text-body-sm text-on-surface">{formatDate(a.data_fim)}</td>
                  <td className="px-4 py-3">{getStatusBadge(a.data_fim)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/apolices/${a.id}`}>
                      <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant">👁</button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!apolices?.length && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-body-sm text-on-surface-variant">
                    Nenhuma apólice vinculada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
