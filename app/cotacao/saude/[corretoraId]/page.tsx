import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { CotacaoSaudeForm } from './form'

interface Props {
  params: Promise<{ corretoraId: string }>
}

export default async function CotacaoSaudePage({ params }: Props) {
  const { corretoraId } = await params

  const service = createServiceClient()
  const { data: corretora } = await service
    .from('corretoras')
    .select('id, nome')
    .eq('id', corretoraId)
    .single()

  if (!corretora) notFound()

  return <CotacaoSaudeForm corretoraId={corretoraId} nomeCorretora={corretora.nome} />
}
