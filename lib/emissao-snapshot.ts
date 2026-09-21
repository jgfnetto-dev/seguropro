import { createServiceClient } from '@/lib/supabase'

/**
 * Atualiza o snapshot anual de prêmio líquido.
 * Chame com delta positivo ao criar, negativo ao excluir diretamente.
 * Nunca chame ao enviar para histórico — o snapshot deve permanecer.
 */
export async function atualizarSnapshotEmissao(
  corretora_id: string,
  ano: number,
  delta: number
) {
  if (!delta || !corretora_id || !ano) return
  const service = createServiceClient()

  const { data: existing } = await service
    .from('emissao_anual')
    .select('total_premio_liquido')
    .eq('corretora_id', corretora_id)
    .eq('ano', ano)
    .maybeSingle()

  const atual = Number(existing?.total_premio_liquido ?? 0)
  const novo = Math.max(0, atual + delta)

  await service
    .from('emissao_anual')
    .upsert(
      { corretora_id, ano, total_premio_liquido: novo, atualizado_em: new Date().toISOString() },
      { onConflict: 'corretora_id,ano' }
    )
}
