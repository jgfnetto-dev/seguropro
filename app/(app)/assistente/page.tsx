export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { AssistenteClient } from './client'

export default async function AssistentePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id, adm')
    .eq('id', session.user.id)
    .single()

  const { data: docs } = await supabase
    .from('assistente_docs')
    .select('id, seguradora, nome, paginas, criado_em')
    .eq('corretora_id', usuario?.corretora_id ?? '')
    .order('seguradora', { ascending: true })
    .order('nome', { ascending: true })

  return (
    <AssistenteClient
      docs={docs ?? []}
      isAdmin={usuario?.adm === 'S'}
    />
  )
}
