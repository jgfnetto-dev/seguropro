import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const API_URL = process.env.EVOLUTION_API_URL!
const API_KEY = process.env.EVOLUTION_API_KEY!
const DEFAULT_INSTANCE = process.env.EVOLUTION_INSTANCE!

async function evoFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: API_KEY,
      ...(init?.headers as Record<string, string> ?? {}),
    },
  })
}

async function getInstanceState(name: string) {
  const res = await evoFetch(`/instance/connect/${name}`)
  if (!res.ok) return { state: 'disconnected' as const }
  const data = await res.json()
  if (data.instance?.state === 'open') return { state: 'connected' as const }
  const qr = data.qrcode?.base64 ?? data.base64 ?? null
  if (qr) return { state: 'qr' as const, qrcode: qr as string }
  return { state: 'disconnected' as const }
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data: u } = await supabase.from('usuarios').select('corretora_id, adm').eq('id', session.user.id).single()
  if (!u?.corretora_id || u.adm !== 'S') return null
  return { userId: session.user.id }
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Apenas administradores podem gerenciar o WhatsApp.' }, { status: 403 })

  const result = await getInstanceState(DEFAULT_INSTANCE)

  if (result.state === 'connected') {
    await supabase.from('usuarios').update({ whatsapp_instance: DEFAULT_INSTANCE }).eq('id', admin.userId)
    return NextResponse.json({ status: 'connected' })
  }
  if (result.state === 'qr') {
    return NextResponse.json({ status: 'qr', qrcode: result.qrcode })
  }
  return NextResponse.json({ status: 'disconnected' })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Apenas administradores podem gerenciar o WhatsApp.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const reconectar = body.action === 'reconectar'

  if (reconectar) {
    // Disconnect current session so the admin can scan with their own phone
    await evoFetch(`/instance/logout/${DEFAULT_INSTANCE}`, { method: 'DELETE' })
  }

  const result = await getInstanceState(DEFAULT_INSTANCE)

  if (result.state === 'connected') {
    await supabase.from('usuarios').update({ whatsapp_instance: DEFAULT_INSTANCE }).eq('id', admin.userId)
    return NextResponse.json({ status: 'connected' })
  }
  if (result.state === 'qr') {
    await supabase.from('usuarios').update({ whatsapp_instance: DEFAULT_INSTANCE }).eq('id', admin.userId)
    return NextResponse.json({ status: 'qr', qrcode: result.qrcode })
  }

  return NextResponse.json({ error: 'Não foi possível obter o QR code. Verifique o servidor Evolution API.' }, { status: 500 })
}
