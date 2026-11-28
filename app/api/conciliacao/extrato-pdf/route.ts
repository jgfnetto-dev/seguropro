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

  // Busca apólices e conciliações existentes em paralelo
  const [{ data: apolices }, { data: conciliacoes }] = await Promise.all([
    supabase
      .from('apolices')
      .select('id, numero_apolice, premio_liquido, comissao_percentual, cliente:clientes(segurado)')
      .eq('corretora_id', usuario.corretora_id),
    supabase
      .from('conciliacao')
      .select('apolice_id, valor_conciliar')
      .eq('corretora_id', usuario.corretora_id),
  ])

  // Soma do que já foi conciliado por apólice
  const jaConciliadoMap = new Map<string, number>()
  for (const c of conciliacoes ?? []) {
    jaConciliadoMap.set(c.apolice_id, (jaConciliadoMap.get(c.apolice_id) ?? 0) + Number(c.valor_conciliar))
  }

  // Remove formatação e zeros à esquerda de strings puramente numéricas
  function normalizar(valor: string) {
    const s = valor.replace(/[\s.\-/]/g, '').toLowerCase()
    if (/^\d+$/.test(s)) {
      try { return BigInt(s).toString() } catch { return s }
    }
    return s
  }

  // Mapa exato e mapa normalizado (para fallback)
  const apoliceMapExato = new Map<string, { id: string; cliente: string }>()
  const apoliceMapNorm = new Map<string, { id: string; cliente: string }[]>()
  const apoliceList: { id: string; cliente: string; norm: string }[] = []

  for (const a of apolices ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cliente = (a.cliente as any)?.segurado ?? ''
    const numExato = String(a.numero_apolice).trim()
    apoliceMapExato.set(numExato, { id: a.id, cliente })
    const norm = normalizar(numExato)
    const lista = apoliceMapNorm.get(norm) ?? []
    lista.push({ id: a.id, cliente })
    apoliceMapNorm.set(norm, lista)
    apoliceList.push({ id: a.id, cliente, norm })
  }

  const encontradas: { numero_apolice: string; apolice_id: string; cliente: string; segurado_extrato: string; comissao: number; fallback?: boolean }[] = []
  const nao_encontradas: { numero_apolice: string; segurado: string; comissao: number; ja_conciliada?: boolean }[] = []

  function classificar(match: { id: string; cliente: string }, numero: string, segurado: string, comissao: number, fallback?: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apolice = (apolices ?? []).find(a => a.id === match.id) as any
    const comissaoCalculada = apolice
      ? Number(apolice.premio_liquido ?? 0) * ((Number(apolice.comissao_percentual ?? 0)) / 100)
      : null
    const jaConciliado = jaConciliadoMap.get(match.id) ?? 0
    const jaConciliada = comissaoCalculada !== null && Math.round((comissaoCalculada - jaConciliado) * 100) / 100 <= 0

    if (jaConciliada) {
      nao_encontradas.push({ numero_apolice: numero, segurado, comissao, ja_conciliada: true })
    } else {
      encontradas.push({ numero_apolice: numero, apolice_id: match.id, cliente: match.cliente, segurado_extrato: segurado, comissao, fallback })
    }
  }

  for (const [numero, { comissao, segurado }] of Array.from(agrupado.entries())) {
    // 1. Match exato
    const matchExato = apoliceMapExato.get(numero)
    if (matchExato) { classificar(matchExato, numero, segurado, comissao); continue }

    const normNumero = normalizar(numero)

    // 2. Fallback normalizado (remove formatação + zeros à esquerda)
    const candidatosNorm = apoliceMapNorm.get(normNumero) ?? []
    if (candidatosNorm.length === 1) { classificar(candidatosNorm[0], numero, segurado, comissao, true); continue }

    // 3. Fallback por sufixo — extrato usa número curto, banco armazena com prefixo
    if (normNumero.length >= 5) {
      const candidatosSufixo = apoliceList.filter(a => a.norm.endsWith(normNumero) && a.norm !== normNumero)
      if (candidatosSufixo.length === 1) { classificar(candidatosSufixo[0], numero, segurado, comissao, true); continue }
    }

    nao_encontradas.push({ numero_apolice: numero, segurado, comissao })
  }

  return NextResponse.json({ encontradas, nao_encontradas })
}
