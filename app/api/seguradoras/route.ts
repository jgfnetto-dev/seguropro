import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

async function getCorretoraId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  return data?.corretora_id ?? null
}

async function getNextCodigo(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, corretora_id: string) {
  const { data } = await supabase
    .from('seguradoras')
    .select('codigo')
    .eq('corretora_id', corretora_id)
    .order('codigo', { ascending: false })
    .limit(1)

  const ultimoCodigo = data?.[0]?.codigo
  const ultimoNumero = ultimoCodigo ? parseInt(ultimoCodigo, 10) || 0 : 0
  return String(ultimoNumero + 1).padStart(4, '0')
}

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('seguradoras').select('*').eq('corretora_id', corretora_id).order('nome')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const codigo = await getNextCodigo(supabase, corretora_id)
  const { data, error } = await supabase.from('seguradoras').insert({ ...body, codigo, corretora_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...body } = await req.json()
  const { data, error } = await supabase.from('seguradoras').update(body).eq('id', id).eq('corretora_id', corretora_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabase.from('seguradoras').delete().eq('id', id).eq('corretora_id', corretora_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
