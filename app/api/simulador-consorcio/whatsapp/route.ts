import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/evolution'
import { getAdminWhatsApp } from '@/lib/whatsapp-admin'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { instance } = await getAdminWhatsApp(supabase, session.user.id)

  const { telefone, texto } = await req.json()
  if (!telefone || !texto) {
    return NextResponse.json({ error: 'Telefone e texto são obrigatórios.' }, { status: 400 })
  }

  try {
    const result = await sendWhatsAppMessage(telefone.trim(), texto, instance)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao enviar mensagem'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
