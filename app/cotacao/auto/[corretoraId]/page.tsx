import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { CotacaoAutoForm } from './form'

interface Props {
  params: Promise<{ corretoraId: string }>
}

export default async function CotacaoAutoPage({ params }: Props) {
  const { corretoraId } = await params

  const service = createServiceClient()
  const { data: corretora } = await service
    .from('corretoras')
    .select('id, nome')
    .eq('id', corretoraId)
    .single()

  if (!corretora) notFound()

  return <CotacaoAutoForm corretoraId={corretoraId} nomeCorretora={corretora.nome} />
}
