export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Plus, Search, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteSeguradoraButton } from './delete-button'

export default async function SeguradorasPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  const corretora_id = usuario?.corretora_id

  let query = supabase.from('seguradoras').select('*').eq('corretora_id', corretora_id).order('nome')
  if (searchParams.q) {
    query = query.or(`nome.ilike.%${searchParams.q}%,codigo.ilike.%${searchParams.q}%`)
  }

  const { data: seguradoras } = await query

  function getInitialColor(nome: string) {
    const colors = ['bg-blue-600', 'bg-green-600', 'bg-red-600', 'bg-purple-600', 'bg-orange-600', 'bg-teal-600']
    const idx = nome.charCodeAt(0) % colors.length
    return colors[idx]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-on-surface">Seguradoras</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Gerencie suas parcerias e ramos de atuação.</p>
        </div>
        <Link href="/seguradoras/novo">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Nova Seguradora
          </Button>
        </Link>
      </div>

      <form method="GET" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar seguradora pelo nome ou código..."
            className="w-full h-10 pl-10 pr-4 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </form>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Código</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Nome da Seguradora</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Ramos</th>
              <th className="label-caps text-on-surface-variant text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {seguradoras?.map((s, i) => (
              <tr key={s.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/50'}`}>
                <td className="px-4 py-3">
                  <span className="text-body-sm font-medium text-secondary">{s.codigo}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${getInitialColor(s.nome)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {s.nome[0]}
                    </div>
                    <span className="text-body-sm font-medium text-on-surface">{s.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.ramos?.map((r: string) => (
                      <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/seguradoras/${s.id}`}>
                      <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </Link>
                    <DeleteSeguradoraButton id={s.id} />
                  </div>
                </td>
              </tr>
            ))}
            {!seguradoras?.length && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-on-surface-variant text-body-sm">
                  Nenhuma seguradora cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {seguradoras && seguradoras.length > 0 && (
          <div className="px-4 py-3 border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
            Exibindo {seguradoras.length} seguradora{seguradoras.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </div>
  )
}
