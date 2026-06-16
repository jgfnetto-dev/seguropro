export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ApoliceForm } from '../form'

export default async function EditApolicePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  const { data: apolice } = await supabase.from('apolices').select('*').eq('id', params.id).single()
  if (!apolice) notFound()

  const { data: seguradoras } = await supabase.from('seguradoras').select('id, nome, ramos').eq('corretora_id', usuario?.corretora_id).order('nome')
  const { data: clientes } = await supabase.from('clientes').select('id, segurado, cpf_cnpj').eq('corretora_id', usuario?.corretora_id).order('segurado')

  return (
    <ApoliceForm
      apolice={apolice}
      seguradoras={seguradoras ?? []}
      clientes={clientes ?? []}
      isEdit
    />
  )
}
