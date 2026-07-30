import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { LeadsSaudeClient } from './client'

export default async function LeadsSaudePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', session.user.id)
    .single()

  if (!usuario) redirect('/auth/login')

  const { data: leads } = await supabase
    .from('leads_saude')
    .select('*')
    .eq('corretora_id', usuario.corretora_id)
    .order('criado_em', { ascending: false })

  return <LeadsSaudeClient corretoraId={usuario.corretora_id} leads={leads ?? []} />
}
