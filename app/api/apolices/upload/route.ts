import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const serviceClient = createServiceClient()
  const safeName = file.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
  const filename = `${session.user.id}/${Date.now()}-${safeName}`
  const arrayBuffer = await file.arrayBuffer()

  const { data, error } = await serviceClient.storage
    .from('apolices-pdf')
    .upload(filename, arrayBuffer, { contentType: 'application/pdf', upsert: true })

  if (error) {
    console.error('[apolices/upload] erro:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = serviceClient.storage.from('apolices-pdf').getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl })
}
