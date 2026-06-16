export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SeguradoraForm } from '../form'

export default async function EditSeguradoraPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: seguradora } = await supabase.from('seguradoras').select('*').eq('id', params.id).single()
  if (!seguradora) notFound()

  return <SeguradoraForm seguradora={seguradora} isEdit />
}
