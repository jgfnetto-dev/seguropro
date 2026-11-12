import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/evolution'
import { getAgoraBrasil } from '@/lib/utils'

function autorizado(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const fromHeader = req.headers.get('x-cron-secret')
  const fromQuery = req.nextUrl.searchParams.get('secret')
  const fromBearer = req.headers.get('authorization')?.replace('Bearer ', '')
  return fromHeader === secret || fromQuery === secret || fromBearer === secret
}

function addDias(dataKey: string, dias: number): string {
  const [y, m, d] = dataKey.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + dias)
  return dt.toISOString().split('T')[0]
}

function formatarData(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}

type ApoliceRow = {
  numero_apolice: string
  data_fim: string
  corretora_id: string
  cliente: { segurado: string } | null
}

type AdminRow = {
  corretora_id: string
  telefone_notificacao: string | null
  telefone_whatsapp: string | null
  whatsapp_instance: string | null
}

async function handle(req: NextRequest) {
  if (!autorizado(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { dataKey: hoje } = getAgoraBrasil()
  const data10 = addDias(hoje, 10)
  const data5 = addDias(hoje, 5)

  const baseQuery = () =>
    supabase
      .from('apolices')
      .select('numero_apolice, data_fim, corretora_id, cliente:clientes(segurado)')
      .or('status_manual.is.null,status_manual.neq.cancelado')

  const [{ data: a10 }, { data: a5 }] = await Promise.all([
    baseQuery().eq('data_fim', data10),
    baseQuery().eq('data_fim', data5),
  ])

  const apolices10 = (a10 ?? []) as unknown as ApoliceRow[]
  const apolices5 = (a5 ?? []) as unknown as ApoliceRow[]

  const corretoraIds = Array.from(new Set([
    ...apolices10.map((a) => a.corretora_id),
    ...apolices5.map((a) => a.corretora_id),
  ]))

  if (!corretoraIds.length) {
    return NextResponse.json({ sent: 0, daqui10: data10, daqui5: data5, msg: 'Nenhuma apólice a vencer.' })
  }

  const { data: admins } = await supabase
    .from('usuarios')
    .select('corretora_id, telefone_notificacao, telefone_whatsapp, whatsapp_instance')
    .in('corretora_id', corretoraIds)
    .eq('adm', 'S')

  const adminPorCorretora = new Map<string, AdminRow>()
  for (const a of (admins ?? []) as AdminRow[]) {
    if (!adminPorCorretora.has(a.corretora_id)) adminPorCorretora.set(a.corretora_id, a)
  }

  let enviados = 0
  const erros: string[] = []

  for (const [corretoraId, admin] of Array.from(adminPorCorretora.entries())) {
    const telefone = admin.telefone_notificacao ?? admin.telefone_whatsapp
    if (!telefone) continue
    const instance = admin.whatsapp_instance ?? process.env.EVOLUTION_INSTANCE

    const grupo10 = apolices10.filter((a) => a.corretora_id === corretoraId)
    if (grupo10.length > 0) {
      const linhas = grupo10
        .map((a) => `• *Nº ${a.numero_apolice}* — ${a.cliente?.segurado ?? 'Cliente'}\n  Vencimento: ${formatarData(a.data_fim)}`)
        .join('\n')
      const plural = grupo10.length > 1 ? 'As seguintes apólices vencem' : 'A seguinte apólice vence'
      const msg = `⚠️ *Aviso de Vencimento — SeguroPro*\n\n${plural} em *10 dias* (${formatarData(data10)}):\n\n${linhas}\n\n_Acesse o SeguroPro para renovar ou entrar em contato com o cliente._`
      try {
        await sendWhatsAppMessage(telefone, msg, instance)
        enviados++
      } catch (e) {
        erros.push(`10d corretora ${corretoraId}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    const grupo5 = apolices5.filter((a) => a.corretora_id === corretoraId)
    if (grupo5.length > 0) {
      const linhas = grupo5
        .map((a) => `• *Nº ${a.numero_apolice}* — ${a.cliente?.segurado ?? 'Cliente'}\n  Vencimento: ${formatarData(a.data_fim)}`)
        .join('\n')
      const plural = grupo5.length > 1 ? 'As seguintes apólices vencem' : 'A seguinte apólice vence'
      const msg = `🔔 *Aviso Urgente — SeguroPro*\n\n${plural} em *5 dias* (${formatarData(data5)}):\n\n${linhas}\n\n_Renove agora antes do vencimento!_`
      try {
        await sendWhatsAppMessage(telefone, msg, instance)
        enviados++
      } catch (e) {
        erros.push(`5d corretora ${corretoraId}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  }

  return NextResponse.json({
    sent: enviados,
    daqui10: data10,
    daqui5: data5,
    apolices10: apolices10.length,
    apolices5: apolices5.length,
    ...(erros.length ? { erros } : {}),
  })
}
