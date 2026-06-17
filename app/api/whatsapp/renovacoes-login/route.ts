import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/evolution'
import { formatDate } from '@/lib/utils'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id, telefone_whatsapp')
    .eq('id', session.user.id)
    .single()

  if (!usuario?.telefone_whatsapp) {
    return NextResponse.json({ sent: false, reason: 'Telefone não configurado no perfil.' })
  }

  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: apolices } = await supabase
    .from('apolices')
    .select('numero_apolice, data_fim, cliente:clientes(segurado), seguradora:seguradoras(nome)')
    .eq('corretora_id', usuario.corretora_id)
    .gte('data_fim', inicio)
    .lte('data_fim', fim)
    .order('data_fim', { ascending: true })

  if (!apolices?.length) {
    return NextResponse.json({ sent: false, reason: 'Nenhuma renovação neste mês.' })
  }

  const mesNome = `${MESES[hoje.getMonth()]}/${hoje.getFullYear()}`
  const lista = apolices.map((a) => {
    const cliente = Array.isArray(a.cliente) ? a.cliente[0] : a.cliente
    const seguradora = Array.isArray(a.seguradora) ? a.seguradora[0] : a.seguradora
    return `• ${cliente?.segurado} (${a.numero_apolice}) — Vence: ${formatDate(a.data_fim)} — ${seguradora?.nome}`
  }).join('\n')

  const texto = `🔄 *Renovações ${mesNome}* — SeguroPro\n\n${lista}\n\nTotal: ${apolices.length} apólice(s) para renovar.`

  try {
    await sendWhatsAppMessage(usuario.telefone_whatsapp, texto)
    return NextResponse.json({ sent: true, total: apolices.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'WhatsApp send failed'
    return NextResponse.json({ sent: false, reason: msg }, { status: 500 })
  }
}
