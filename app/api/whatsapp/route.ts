import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWhatsAppDocument } from '@/lib/evolution'
import { gerarPdfRenovacoes } from '@/lib/pdf'

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

  const { apolices, mesNome } = await req.json()
  if (!Array.isArray(apolices) || !apolices.length) {
    return NextResponse.json({ error: 'No apolices provided' }, { status: 400 })
  }

  try {
    const pdfBuffer = await gerarPdfRenovacoes(apolices, mesNome ?? '')
    const base64 = pdfBuffer.toString('base64')
    const caption = `🔄 Renovações ${mesNome ?? ''} — SeguroPro\nTotal: ${apolices.length} apólice(s) para renovar.`
    const result = await sendWhatsAppDocument(telefone, base64, `renovacoes-${mesNome ?? 'mes'}.pdf`, caption)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'WhatsApp send failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
