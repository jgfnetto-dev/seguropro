import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

async function getCorretoraId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  return data?.corretora_id ?? null
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apolice_id, numero_apolice, data_conciliacao, valor_conciliar, comentario } = await req.json()
  if (!apolice_id || !numero_apolice || !data_conciliacao || valor_conciliar === undefined || valor_conciliar === null) {
    return NextResponse.json({ error: 'Informe apólice, data e valor a conciliar.' }, { status: 400 })
  }

  const valor = parseFloat(valor_conciliar)
  if (Number.isNaN(valor) || valor <= 0) {
    return NextResponse.json({ error: 'Valor a conciliar inválido.' }, { status: 400 })
  }

  const { data: registro, error } = await supabase
    .from('conciliacao')
    .insert({ corretora_id, apolice_id, numero_apolice, data_conciliacao, valor_conciliar: valor, comentario: comentario ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(registro, { status: 201 })
}
