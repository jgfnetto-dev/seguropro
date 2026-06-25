import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

async function getRequestingUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('usuarios').select('corretora_id, adm').eq('id', session.user.id).single()
  if (!data) return null
  return { userId: session.user.id, corretora_id: data.corretora_id, isAdmin: data.adm === 'S' }
}

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const requester = await getRequestingUser(supabase)
  if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('usuarios')
    .select('id, nome, email, telefone_whatsapp, adm, criado_em')
    .eq('corretora_id', requester.corretora_id)
    .order('criado_em')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const requester = await getRequestingUser(supabase)
  if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!requester.isAdmin) {
    return NextResponse.json({ error: 'Apenas o administrador pode criar novos usuários.' }, { status: 403 })
  }

  const { nome, email, senha, telefone_whatsapp } = await req.json()
  if (!nome || !email || !senha || !telefone_whatsapp) {
    return NextResponse.json({ error: 'Informe nome, e-mail, celular/WhatsApp e senha.' }, { status: 400 })
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (authError) {
    console.error('[usuarios POST] erro ao criar auth user:', authError.message)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const { data, error } = await serviceClient
    .from('usuarios')
    .insert({ id: authUser.user.id, corretora_id: requester.corretora_id, email, nome, telefone_whatsapp, adm: 'N', senha_deve_ser_alterada: true })
    .select('id, nome, email, telefone_whatsapp, adm, criado_em')
    .single()

  if (error) {
    console.error('[usuarios POST] erro ao inserir na tabela usuarios:', error.message)
    await serviceClient.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  delete body.adm // ninguém altera o próprio nível de administrador por aqui

  const { data, error } = await supabase
    .from('usuarios')
    .update(body)
    .eq('id', session.user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const requester = await getRequestingUser(supabase)
  if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!requester.isAdmin) {
    return NextResponse.json({ error: 'Apenas o administrador pode excluir usuários.' }, { status: 403 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === requester.userId) {
    return NextResponse.json({ error: 'Você não pode excluir o próprio usuário.' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { data: alvo } = await serviceClient.from('usuarios').select('corretora_id').eq('id', id).single()
  if (!alvo || alvo.corretora_id !== requester.corretora_id) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  }

  const { error: deleteRowError } = await serviceClient.from('usuarios').delete().eq('id', id).eq('corretora_id', requester.corretora_id)
  if (deleteRowError) return NextResponse.json({ error: deleteRowError.message }, { status: 500 })

  await serviceClient.auth.admin.deleteUser(id)

  return NextResponse.json({ success: true })
}
