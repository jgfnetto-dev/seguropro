export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { LeadsAutoClient } from './client'

export default async function LeadsAutoPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', session.user.id)
    .single()

  const corretoraId = usuario?.corretora_id
  if (!corretoraId) redirect('/dashboard')

  const { data: leads } = await supabase
    .from('leads_auto')
    .select('*')
    .eq('corretora_id', corretoraId)
    .order('criado_em', { ascending: false })

  return <LeadsAutoClient corretoraId={corretoraId} leads={leads ?? []} />
}
