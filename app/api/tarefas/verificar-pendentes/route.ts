import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/evolution'
import { formatDate } from '@/lib/utils'

export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, telefone_whatsapp')
    .eq('id', session.user.id)
    .single()

  if (!usuario?.telefone_whatsapp) {
    return NextResponse.json({ sent: 0, reason: 'Telefone não configurado no perfil.' })
  }

  const agora = new Date()
  const hoje = agora.toISOString().split('T')[0]
  const horaAtual = agora.toTimeString().slice(0, 8)

  const { data: pendentes } = await supabase
    .from('tarefas')
    .select('*')
    .eq('usuario_id', usuario.id)
    .eq('whatsapp_enviado', false)
    .or(`data.lt.${hoje},and(data.eq.${hoje},hora.lte.${horaAtual})`)

  if (!pendentes?.length) {
    return NextResponse.json({ sent: 0 })
  }

  let enviadas = 0
  for (const tarefa of pendentes) {
    const texto = `📅 *Lembrete de Tarefa* — SeguroPro\n\n${tarefa.tarefa}\n\nAgendado para ${formatDate(tarefa.data)} às ${tarefa.hora.slice(0, 5)}.`
    try {
      await sendWhatsAppMessage(usuario.telefone_whatsapp, texto)
      await supabase.from('tarefas').update({ whatsapp_enviado: true }).eq('id', tarefa.id)
      enviadas++
    } catch {
      // Mantém a tarefa pendente para nova tentativa na próxima verificação.
    }
  }

  return NextResponse.json({ sent: enviadas })
}
