import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { enviarLembretesPendentes } from '@/lib/tarefas-lembrete'

function autorizado(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const fromHeader = req.headers.get('x-cron-secret')
  const fromQuery = req.nextUrl.searchParams.get('secret')
  return fromHeader === secret || fromQuery === secret
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}

async function handle(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const agora = new Date()
  const hoje = agora.toISOString().split('T')[0]
  const horaAtual = agora.toTimeString().slice(0, 8)

  const { data: pendentes, error } = await supabase
    .from('tarefas')
    .select('id, data, hora, tarefa, usuario_id, usuarios(telefone_whatsapp)')
    .eq('whatsapp_enviado', false)
    .or(`data.lt.${hoje},and(data.eq.${hoje},hora.lte.${horaAtual})`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!pendentes?.length) return NextResponse.json({ sent: 0 })

  const porUsuario = new Map<string, { telefone: string; tarefas: { id: string; data: string; hora: string; tarefa: string }[] }>()
  for (const t of pendentes as unknown as { id: string; data: string; hora: string; tarefa: string; usuario_id: string; usuarios: { telefone_whatsapp: string | null } | null }[]) {
    const telefone = t.usuarios?.telefone_whatsapp
    if (!telefone) continue
    const grupo = porUsuario.get(t.usuario_id) ?? { telefone, tarefas: [] }
    grupo.tarefas.push({ id: t.id, data: t.data, hora: t.hora, tarefa: t.tarefa })
    porUsuario.set(t.usuario_id, grupo)
  }

  let totalEnviadas = 0
  for (const { telefone, tarefas } of Array.from(porUsuario.values())) {
    totalEnviadas += await enviarLembretesPendentes(supabase, tarefas, telefone)
  }

  return NextResponse.json({ sent: totalEnviadas })
}
