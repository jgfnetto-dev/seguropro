import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

async function getUsuario(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('usuarios').select('id, corretora_id').eq('id', session.user.id).single()
  return data
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const usuario = await getUsuario(supabase)
  if (!usuario) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('tarefas')
    .select('*')
    .eq('usuario_id', usuario.id)
    .order('data', { ascending: true })
    .order('hora', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const usuario = await getUsuario(supabase)
  if (!usuario) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, hora, tarefa } = await req.json()
  if (!data || !hora || !tarefa) {
    return NextResponse.json({ error: 'Informe data, hora e a tarefa.' }, { status: 400 })
  }

  const { data: registro, error } = await supabase
    .from('tarefas')
    .insert({ corretora_id: usuario.corretora_id, usuario_id: usuario.id, data, hora, tarefa })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(registro, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const usuario = await getUsuario(supabase)
  if (!usuario) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, data, hora, tarefa } = await req.json()
  if (!id || !data || !hora || !tarefa) {
    return NextResponse.json({ error: 'Informe data, hora e a tarefa.' }, { status: 400 })
  }

  // Não reseta whatsapp_enviado: uma tarefa já enviada não deve ser notificada de novo,
  // mesmo que o texto/data/hora sejam corrigidos depois do envio.
  const { data: registro, error } = await supabase
    .from('tarefas')
    .update({ data, hora, tarefa })
    .eq('id', id)
    .eq('usuario_id', usuario.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(registro)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const usuario = await getUsuario(supabase)
  if (!usuario) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  const enviadas = req.nextUrl.searchParams.get('enviadas')

  if (enviadas === 'true') {
    const { error } = await supabase.from('tarefas').delete().eq('usuario_id', usuario.id).eq('whatsapp_enviado', true)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.from('tarefas').delete().eq('id', id).eq('usuario_id', usuario.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
