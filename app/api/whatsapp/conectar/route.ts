import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

const API_URL = process.env.EVOLUTION_API_URL!
const ADMIN_KEY = process.env.EVOLUTION_ADMIN_KEY!

function instanceNameFor(corretoraId: string) {
  return `sp-${corretoraId.replace(/-/g, '').slice(0, 12)}`
}

async function evoFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: ADMIN_KEY,
      ...(init?.headers as Record<string, string> ?? {}),
    },
  })
}

type InstanceState =
  | { state: 'connected' }
  | { state: 'qr'; qrcode: string }
  | { state: 'disconnected' }
  | { state: 'not_found' }

async function getInstanceState(name: string): Promise<InstanceState> {
  // fetchInstances is the most reliable way to check if an instance exists
  const listRes = await evoFetch('/instance/fetchInstances')
  if (!listRes.ok) return { state: 'not_found' }

  const instances: Array<{ name: string; connectionStatus: string }> = await listRes.json()
  const found = instances.find((i) => i.name === name)

  if (!found) return { state: 'not_found' }
  if (found.connectionStatus === 'open') return { state: 'connected' }

  // Instance exists but is not connected — get QR code
  const qrRes = await evoFetch(`/instance/connect/${name}`)
  if (qrRes.ok) {
    const qrData = await qrRes.json()
    const qr = qrData.qrcode?.base64 ?? qrData.base64 ?? null
    if (qr) return { state: 'qr', qrcode: qr }
  }

  return { state: 'disconnected' }
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data: u } = await supabase.from('usuarios').select('corretora_id, adm').eq('id', session.user.id).single()
  if (!u?.corretora_id || u.adm !== 'S') return null
  return { userId: session.user.id, corretoraId: u.corretora_id as string }
}

async function saveInstance(userId: string, instanceName: string) {
  const service = createServiceClient()
  await service.from('usuarios').update({ whatsapp_instance: instanceName }).eq('id', userId)
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Apenas administradores podem gerenciar o WhatsApp.' }, { status: 403 })

  const name = instanceNameFor(admin.corretoraId)
  const result = await getInstanceState(name)

  if (result.state === 'connected') {
    await saveInstance(admin.userId, name)
    return NextResponse.json({ status: 'connected', instanceName: name })
  }
  if (result.state === 'qr') {
    return NextResponse.json({ status: 'qr', qrcode: result.qrcode, instanceName: name })
  }
  return NextResponse.json({ status: 'none', instanceName: name })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Apenas administradores podem gerenciar o WhatsApp.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const reconectar = body.action === 'reconectar'
  const name = instanceNameFor(admin.corretoraId)

  if (reconectar) {
    await evoFetch(`/instance/logout/${name}`, { method: 'DELETE' })
  }

  const result = await getInstanceState(name)

  if (result.state === 'connected') {
    await saveInstance(admin.userId, name)
    return NextResponse.json({ status: 'connected', instanceName: name })
  }

  if (result.state === 'qr') {
    await saveInstance(admin.userId, name)
    return NextResponse.json({ status: 'qr', qrcode: result.qrcode, instanceName: name })
  }

  if (result.state === 'disconnected') {
    // Instance exists but not connected — just return disconnected, QR not available yet
    await saveInstance(admin.userId, name)
    return NextResponse.json({ status: 'disconnected', instanceName: name })
  }

  // Instance does not exist — create it
  const createRes = await evoFetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify({ instanceName: name, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    return NextResponse.json({ error: `Erro ao criar instância: ${err}` }, { status: 500 })
  }

  const createData = await createRes.json()
  const qrBase64 = createData.qrcode?.base64 ?? null

  await saveInstance(admin.userId, name)

  return NextResponse.json({
    status: qrBase64 ? 'qr' : 'disconnected',
    qrcode: qrBase64,
    instanceName: name,
  })
}
