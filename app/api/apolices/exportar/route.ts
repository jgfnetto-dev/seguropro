import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { gerarPDFApolices } from '@/lib/pdf-apolices'
import { sendWhatsAppDocument } from '@/lib/evolution'
import { sendEmail } from '@/lib/email'
import { MESES } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

  const { destination, via, q, mes, ano, sort, dir } = body

  if (!destination?.trim() || !via) {
    return NextResponse.json({ error: 'Informe o destino.' }, { status: 400 })
  }

  // Same filter logic as the apólices page
  const ascending = dir !== 'desc'

  let query = supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado), seguradora:seguradoras(nome)')
    .order('data_fim', { ascending })

  if (q) {
    const { data: clientesMatch } = await supabase
      .from('clientes').select('id').ilike('segurado', `%${q}%`)
    const ids = clientesMatch?.map((c) => c.id) ?? []
    query = ids.length
      ? query.or(`numero_apolice.ilike.%${q}%,cliente_id.in.(${ids.join(',')})`)
      : query.ilike('numero_apolice', `%${q}%`)
  }

  if (mes && ano) {
    const m = parseInt(mes), a = parseInt(ano)
    const inicio = `${a}-${String(m).padStart(2, '0')}-01`
    const fim = `${a}-${String(m).padStart(2, '0')}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}`
    query = query.gte('data_emissao', inicio).lte('data_emissao', fim)
  }

  const { data: apolices, error } = await query
  if (error) return NextResponse.json({ error: 'Erro ao buscar apólices.' }, { status: 500 })

  // Sort client/seguradora in memory if requested
  if ((sort === 'cliente' || sort === 'seguradora') && apolices) {
    apolices.sort((a, b) => {
      const va = sort === 'cliente' ? (a.cliente?.segurado ?? '') : (a.seguradora?.nome ?? '')
      const vb = sort === 'cliente' ? (b.cliente?.segurado ?? '') : (b.seguradora?.nome ?? '')
      return ascending ? va.localeCompare(vb, 'pt-BR') : vb.localeCompare(va, 'pt-BR')
    })
  }

  const parts: string[] = []
  if (q) parts.push(`Busca: "${q}"`)
  if (mes && ano) {
    const nomeMes = MESES.find((m) => m.value === mes)?.label ?? mes
    parts.push(`Emissão: ${nomeMes}/${ano}`)
  }
  const filtrosLabel = parts.length ? parts.join(' | ') : 'Todas as apólices'

  const apolicesData = (apolices ?? []).map((a) => ({
    numero_apolice: a.numero_apolice,
    cliente_nome: a.cliente?.segurado ?? '-',
    seguradora_nome: a.seguradora?.nome ?? '-',
    tipo_seguro: a.tipo_seguro,
    data_emissao: a.data_emissao,
    data_fim: a.data_fim,
    premio_liquido: Number(a.premio_liquido),
    premio_total: Number(a.premio_total),
  }))

  const pdfBytes = await gerarPDFApolices(apolicesData, filtrosLabel)
  const base64 = Buffer.from(pdfBytes).toString('base64')
  const fileName = `apolices-${new Date().toISOString().slice(0, 10)}.pdf`

  try {
    if (via === 'whatsapp') {
      const { data: usuario } = await supabase
        .from('usuarios').select('whatsapp_instance').eq('id', session.user.id).single()
      const instance = usuario?.whatsapp_instance ?? process.env.EVOLUTION_INSTANCE
      await sendWhatsAppDocument(
        destination, base64, fileName,
        `📋 Relatório de Apólices — ${filtrosLabel} (${apolicesData.length} registros)`,
        instance
      )
    } else {
      await sendEmail({
        to: destination,
        subject: 'SeguroPro — Relatório de Apólices',
        html: `
          <p>Segue em anexo o relatório de apólices.</p>
          <p><strong>Filtro:</strong> ${filtrosLabel}</p>
          <p><strong>Total:</strong> ${apolicesData.length} apólice${apolicesData.length !== 1 ? 's' : ''}.</p>
          <br><p style="color:#666;font-size:12px">SeguroPro — Gestão de Corretoras</p>
        `,
        attachmentBase64: base64,
        attachmentFilename: fileName,
      })
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao enviar: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, total: apolicesData.length })
}
