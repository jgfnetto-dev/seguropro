import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/evolution'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('telefone_whatsapp')
    .eq('id', session.user.id)
    .single()

  const telefone = usuario?.telefone_whatsapp
  if (!telefone) return NextResponse.json({ error: 'WhatsApp number not configured in profile' }, { status: 400 })

  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  try {
    const result = await sendWhatsAppMessage(telefone, text)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'WhatsApp send failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
