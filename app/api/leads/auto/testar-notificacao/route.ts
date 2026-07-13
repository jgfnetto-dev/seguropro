import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/evolution'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id, adm')
    .eq('id', session.user.id)
    .single()

  if (!usuario?.corretora_id) {
    return NextResponse.json({ error: 'Corretora não encontrada.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: admin, error: adminError } = await service
    .from('usuarios')
    .select('telefone_whatsapp, nome')
    .eq('corretora_id', usuario.corretora_id)
    .eq('adm', 'S')
    .single()

  if (adminError) {
    return NextResponse.json({ error: `Erro ao buscar admin: ${adminError.message}` }, { status: 500 })
  }
  if (!admin) {
    return NextResponse.json({ error: 'Nenhum administrador encontrado para esta corretora.' }, { status: 404 })
  }
  if (!admin.telefone_whatsapp) {
    return NextResponse.json({
      error: 'WhatsApp não configurado. Acesse Perfil e preencha o campo "WhatsApp / Telefone".',
    }, { status: 400 })
  }

  const instance = process.env.EVOLUTION_INSTANCE
  if (!instance) {
    return NextResponse.json({ error: 'EVOLUTION_INSTANCE não configurado nas variáveis de ambiente.' }, { status: 500 })
  }

  try {
    await sendWhatsAppMessage(
      admin.telefone_whatsapp,
      `✅ *Teste de notificação — SeguroPro*\n\nOlá! Este é um teste para confirmar que as notificações de novos leads estão funcionando corretamente.`,
      instance,
    )
    return NextResponse.json({ success: true, telefone: admin.telefone_whatsapp, instance })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Falha ao enviar: ${msg}` }, { status: 500 })
  }
}
