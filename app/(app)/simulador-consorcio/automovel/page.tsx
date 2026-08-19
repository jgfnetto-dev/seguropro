import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SimuladorConsorcioClient } from '../client'

export default async function SimuladorAutomovelPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')
  return <SimuladorConsorcioClient />
}
