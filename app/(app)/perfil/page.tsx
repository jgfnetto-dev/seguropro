export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PerfilClient } from './client'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { count: totalApolices } = await supabase
    .from('apolices')
    .select('*', { count: 'exact', head: true })
    .eq('corretora_id', usuario?.corretora_id)

  const hoje = new Date()
  const { count: renovacoesMes } = await supabase
    .from('apolices')
    .select('*', { count: 'exact', head: true })
    .eq('corretora_id', usuario?.corretora_id)
    .gte('data_fim', new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0])
    .lte('data_fim', new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0])

  const { count: clientesNovos } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .eq('corretora_id', usuario?.corretora_id)
    .gte('criado_em', new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString())

  return (
    <PerfilClient
      usuario={usuario}
      stats={{
        totalApolices: totalApolices ?? 0,
        renovacoesMes: renovacoesMes ?? 0,
        clientesNovos: clientesNovos ?? 0,
      }}
    />
  )
}
