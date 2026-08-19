import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

async function getUsuarioCorretora(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase
    .from('usuarios')
    .select('corretora_id, adm')
    .eq('id', session.user.id)
    .single()
  return data ?? null
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const usuario = await getUsuarioCorretora(supabase)
  if (!usuario?.corretora_id) return NextResponse.json({ logo_url: null })

  const service = createServiceClient()
  const { data: corretora } = await service
    .from('corretoras')
    .select('logo_url')
    .eq('id', usuario.corretora_id)
    .single()

  return NextResponse.json({ logo_url: corretora?.logo_url ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const usuario = await getUsuarioCorretora(supabase)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  if (!usuario.corretora_id) return NextResponse.json({ error: 'Corretora não encontrada.' }, { status: 404 })
  if (usuario.adm !== 'S') return NextResponse.json({ error: 'Sem permissão. Apenas administradores.' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })

  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato inválido. Use PNG, JPG, WebP ou SVG.' }, { status: 400 })
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2 MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const filename = `${usuario.corretora_id}/logo.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const service = createServiceClient()

  // Cria o bucket se não existir
  const { data: buckets } = await service.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === 'logos-corretora')
  if (!bucketExists) {
    await service.storage.createBucket('logos-corretora', { public: true })
  }

  const { data, error } = await service.storage
    .from('logos-corretora')
    .upload(filename, arrayBuffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage.from('logos-corretora').getPublicUrl(data.path)

  // Atualiza a tabela corretoras com a URL pública da logo
  const { error: updateErr } = await service
    .from('corretoras')
    .update({ logo_url: publicUrl })
    .eq('id', usuario.corretora_id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ logo_url: publicUrl })
}
