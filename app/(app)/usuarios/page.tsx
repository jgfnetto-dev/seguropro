export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { UsuariosClient } from './client'

export default async function UsuariosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase.from('usuarios').select('corretora_id, adm').eq('id', session.user.id).single()

  const serviceClient = createServiceClient()
  const { data: usuarios } = await serviceClient
    .from('usuarios')
    .select('id, nome, email, telefone_whatsapp, adm, criado_em')
    .eq('corretora_id', usuario?.corretora_id)
    .order('criado_em')

  return <UsuariosClient usuarios={usuarios ?? []} usuarioAtualId={session.user.id} isAdmin={usuario?.adm === 'S'} />
}
