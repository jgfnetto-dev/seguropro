export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Search, Eye, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCpfCnpj } from '@/lib/utils'

export default async function ClientesPage({ searchParams }: { searchParams: { q?: string; tipo?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  let query = supabase.from('clientes').select('*').order('segurado')
  if (searchParams.q) {
    const termo = searchParams.q
    const digitos = termo.replace(/\D/g, '')
    query = digitos
      ? query.or(`segurado.ilike.%${termo}%,cpf_cnpj.ilike.%${digitos}%`)
      : query.or(`segurado.ilike.%${termo}%,cpf_cnpj.ilike.%${termo}%`)
  }
  if (searchParams.tipo === 'PF') query = query.eq('pf_pj', 'PF')
  if (searchParams.tipo === 'PJ') query = query.eq('pf_pj', 'PJ')
  const { data: clientes } = await query

  const filtros = [
    { label: 'Todos', valor: '' },
    { label: 'Pessoa Física', valor: 'PF' },
    { label: 'Pessoa Jurídica', valor: 'PJ' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-on-surface">Clientes</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">Gerencie sua base de segurados com eficiência.</p>
      </div>

      <form method="GET" className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por nome, CPF ou CNPJ..."
            className="w-full h-10 pl-10 pr-4 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchParams.tipo && <input type="hidden" name="tipo" value={searchParams.tipo} />}
        </div>
        <div className="flex gap-2">
          {filtros.map(({ label, valor }) => (
            <Link
              key={label}
              href={`/clientes${valor ? `?tipo=${valor}` : ''}${searchParams.q ? `${valor ? '&' : '?'}q=${searchParams.q}` : ''}`}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                (searchParams.tipo ?? '') === valor
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-card text-on-surface-variant border-outline-variant hover:bg-surface-container'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </form>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">CPF/CNPJ</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Cliente (Segurado)</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">E-mail</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Telefone</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">PF/PJ</th>
              <th className="label-caps text-on-surface-variant text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes?.map((c, i) => (
              <tr key={c.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/40'}`}>
                <td className="px-4 py-3 text-body-sm text-on-surface-variant">{formatCpfCnpj(c.cpf_cnpj)}</td>
                <td className="px-4 py-3">
                  <Link href={`/clientes/${c.id}`} className="text-body-sm font-medium text-secondary hover:underline">
                    {c.segurado}
                  </Link>
                </td>
                <td className="px-4 py-3 text-body-sm text-on-surface-variant">{c.email || '—'}</td>
                <td className="px-4 py-3 text-body-sm text-on-surface-variant">{c.telefone || '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{c.pf_pj}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/clientes/${c.id}`}>
                      <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href={`/clientes/${c.id}`}>
                      <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {!clientes?.length && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-body-sm text-on-surface-variant">
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {clientes && clientes.length > 0 && (
          <div className="px-4 py-3 border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
            Exibindo {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </div>
  )
}
