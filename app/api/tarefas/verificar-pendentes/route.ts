import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { enviarLembretesPendentes } from '@/lib/tarefas-lembrete'

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
    .select('id, data, hora, tarefa')
    .eq('usuario_id', usuario.id)
    .eq('whatsapp_enviado', false)
    .or(`data.lt.${hoje},and(data.eq.${hoje},hora.lte.${horaAtual})`)

  if (!pendentes?.length) {
    return NextResponse.json({ sent: 0 })
  }

  const enviadas = await enviarLembretesPendentes(supabase, pendentes, usuario.telefone_whatsapp)
  return NextResponse.json({ sent: enviadas })
}
