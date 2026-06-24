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
  const clienteId = req.nextUrl.searchParams.get('cliente_id')
  const numeroApolice = req.nextUrl.searchParams.get('numero_apolice')

  let query = supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado), seguradora:seguradoras(nome)')
    .eq('corretora_id', corretora_id)
    .order('criado_em', { ascending: false })

  if (clienteId) query = query.eq('cliente_id', clienteId)
  if (numeroApolice) query = query.eq('numero_apolice', numeroApolice)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await supabase.from('apolices').insert({ ...body, corretora_id }).select().single()
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Esta apólice já está cadastrada para este cliente.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...body } = await req.json()
  const { data, error } = await supabase.from('apolices').update(body).eq('id', id).eq('corretora_id', corretora_id).select().single()
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Esta apólice já está cadastrada para este cliente.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: apolice, error: fetchError } = await supabase
    .from('apolices')
    .select('cliente_id')
    .eq('id', id)
    .eq('corretora_id', corretora_id)
    .single()
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  await Promise.all([
    supabase.from('status_renovacao').delete().eq('apolice_id', id),
    supabase.from('conciliacao').delete().eq('apolice_id', id),
    supabase.from('endossos').delete().eq('apolice_id', id),
  ])

  const { error } = await supabase.from('apolices').delete().eq('id', id).eq('corretora_id', corretora_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count } = await supabase
    .from('apolices')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', apolice.cliente_id)
    .eq('corretora_id', corretora_id)

  let clienteExcluido = false
  if (count === 0) {
    const { error: clienteError } = await supabase
      .from('clientes')
      .delete()
      .eq('id', apolice.cliente_id)
      .eq('corretora_id', corretora_id)
    if (!clienteError) clienteExcluido = true
  }

  return NextResponse.json({ success: true, clienteExcluido })
}
