import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SimuladorImovelClient } from '../imovel-client'

export default async function SimuladorImovelPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  return <SimuladorImovelClient />
}
