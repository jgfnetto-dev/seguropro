import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { extractExtratoPdf } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', session.user.id)
    .single()
  if (!usuario?.corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 })

  // Extrai texto do PDF server-side
  let pdfText: string
  try {
    const { PDFParse } = await import('pdf-parse')
    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const { text } = await parser.getText()
    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'PDF sem texto legível.' }, { status: 422 })
    }
    pdfText = text
  } catch {
    return NextResponse.json({ error: 'Falha ao ler o PDF.' }, { status: 500 })
  }

  // Extrai itens via IA
  let itens: Awaited<ReturnType<typeof extractExtratoPdf>>
  try {
    itens = await extractExtratoPdf(pdfText)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha na extração'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  if (!itens.length) {
    return NextResponse.json({ error: 'Nenhum item encontrado no extrato.' }, { status: 422 })
  }

  // Agrupa por numero_apolice (soma comissões da mesma apólice)
  const agrupado = new Map<string, { comissao: number; segurado: string }>()
  for (const item of itens) {
    const key = String(item.numero_apolice).trim()
    const atual = agrupado.get(key) ?? { comissao: 0, segurado: item.segurado }
    agrupado.set(key, { comissao: atual.comissao + Number(item.comissao), segurado: atual.segurado })
  }

  // Busca todas as apólices da corretora para fazer o matching
  const { data: apolices } = await supabase
    .from('apolices')
    .select('id, numero_apolice, cliente:clientes(segurado)')
    .eq('corretora_id', usuario.corretora_id)

  const apoliceMap = new Map<string, { id: string; cliente: string }>()
  for (const a of apolices ?? []) {
    apoliceMap.set(String(a.numero_apolice).trim(), {
      id: a.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cliente: (a.cliente as any)?.segurado ?? '',
    })
  }

  const encontradas: { numero_apolice: string; apolice_id: string; cliente: string; segurado_extrato: string; comissao: number }[] = []
  const nao_encontradas: { numero_apolice: string; segurado: string; comissao: number }[] = []

  for (const [numero, { comissao, segurado }] of Array.from(agrupado.entries())) {
    const match = apoliceMap.get(numero)
    if (match) {
      encontradas.push({ numero_apolice: numero, apolice_id: match.id, cliente: match.cliente, segurado_extrato: segurado, comissao })
    } else {
      nao_encontradas.push({ numero_apolice: numero, segurado, comissao })
    }
  }

  return NextResponse.json({ encontradas, nao_encontradas })
}
