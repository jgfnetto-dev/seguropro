import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

async function getCorretoraId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  return data?.corretora_id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apoliceId = req.nextUrl.searchParams.get('apolice_id')
  let query = supabase.from('documentos_apolice').select('*').eq('corretora_id', corretora_id).order('criado_em', { ascending: false })
  if (apoliceId) query = query.eq('apolice_id', apoliceId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apolice_id, numero_apolice, nome_documento, documento_url } = await req.json()
  if (!apolice_id || !numero_apolice || !nome_documento || !documento_url) {
    return NextResponse.json({ error: 'Informe apólice, nome do documento e o arquivo.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('documentos_apolice')
    .insert({ corretora_id, apolice_id, numero_apolice, nome_documento, documento_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('documentos_apolice').delete().eq('id', id).eq('corretora_id', corretora_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
