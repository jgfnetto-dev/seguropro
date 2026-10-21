import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWhatsAppDocument } from '@/lib/evolution'
import { sendEmail, buildAdminFrom } from '@/lib/email'
import { gerarPdfConciliacao } from '@/lib/pdf'
import { formatCpfCnpj } from '@/lib/utils'
import { getAdminWhatsApp } from '@/lib/whatsapp-admin'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { canal, destination, q, mes, ano } = await req.json()
  if (!canal || !destination?.trim()) {
    return NextResponse.json({ error: 'Informe o canal de envio e o destino.' }, { status: 400 })
  }

  let query = supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado, cpf_cnpj)')
    .order('data_inicio', { ascending: true })

  if (q) {
    const { data: clientesMatch } = await supabase
      .from('clientes')
      .select('id')
      .ilike('segurado', `%${q}%`)
    const clienteIds = clientesMatch?.map((c: { id: string }) => c.id) ?? []
    query = clienteIds.length
      ? query.or(`numero_apolice.ilike.%${q}%,cliente_id.in.(${clienteIds.join(',')})`)
      : query.ilike('numero_apolice', `%${q}%`)
  }

  if (mes && ano) {
    const m = parseInt(mes)
    const a = parseInt(ano)
    const inicio = `${a}-${String(m).padStart(2, '0')}-01`
    const ultimoDia = new Date(a, m, 0).getDate()
    const fim = `${a}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
    query = query.gte('data_inicio', inicio).lte('data_inicio', fim)
  }

  const { data: apolices } = await query

  if (!apolices?.length) {
    return NextResponse.json({ error: 'Nenhuma apólice encontrada com o filtro aplicado.' }, { status: 400 })
  }

  const apoliceIds = apolices.map((a) => a.id)
  const { data: conciliacoes } = await supabase
    .from('conciliacao')
    .select('apolice_id, data_conciliacao, valor_conciliar')
    .in('apolice_id', apoliceIds)
    .order('data_conciliacao', { ascending: true })

  const conciliacoesPorApolice = new Map<string, { data_conciliacao: string; valor_conciliar: number }[]>()
  conciliacoes?.forEach((c) => {
    const lista = conciliacoesPorApolice.get(c.apolice_id) ?? []
    lista.push(c)
    conciliacoesPorApolice.set(c.apolice_id, lista)
  })

  const labelFiltro = (() => {
    const parts: string[] = []
    if (q) parts.push(`Busca: "${q}"`)
    if (mes && ano) {
      const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      parts.push(`${MESES[parseInt(mes) - 1]}/${ano}`)
    }
    return parts.length ? parts.join(' | ') : 'Todas as apólices'
  })()

  const apolicesParaPdf = apolices.map((a) => ({
    numero_apolice: a.numero_apolice,
    cpf_cnpj: a.cliente?.cpf_cnpj ? formatCpfCnpj(a.cliente.cpf_cnpj) : undefined,
    cliente: a.cliente?.segurado,
    data_emissao: a.data_emissao,
    data_inicio: a.data_inicio,
    data_fim: a.data_fim,
    premio_liquido: a.premio_liquido,
    comissao_percentual: a.comissao_percentual,
    comissao: a.premio_liquido * ((a.comissao_percentual ?? 0) / 100),
    conciliacoes: conciliacoesPorApolice.get(a.id) ?? [],
  }))

  try {
    const admin = await getAdminWhatsApp(supabase, session.user.id)

    const pdfBuffer = await gerarPdfConciliacao(apolicesParaPdf, labelFiltro)
    const base64 = pdfBuffer.toString('base64')
    const nomeArquivo = `conciliacao-${new Date().toISOString().slice(0, 10)}.pdf`

    if (canal === 'whatsapp') {
      const caption = `📊 *Relatório de Conciliação — ${labelFiltro}*\nTotal: ${apolices.length} apólice(s).`
      await sendWhatsAppDocument(destination.trim(), base64, nomeArquivo, caption, admin.instance)
      return NextResponse.json({ success: true, canal: 'whatsapp', total: apolices.length })
    }

    if (canal === 'email') {
      const adminFrom = buildAdminFrom(admin.nome, admin.email)
      await sendEmail({
        to: destination.trim(),
        subject: `Relatório de Conciliação — ${labelFiltro}`,
        html: `<p>Olá,</p><p>Segue em anexo o relatório de conciliação. Filtro: <strong>${labelFiltro}</strong>.</p><p>Total: ${apolices.length} apólice(s).</p><p>SeguroPro</p>`,
        from: adminFrom ?? undefined,
        replyTo: admin.email ?? undefined,
        attachmentBase64: base64,
        attachmentFilename: nomeArquivo,
      })
      return NextResponse.json({ success: true, canal: 'email', total: apolices.length })
    }

    return NextResponse.json({ error: 'Canal inválido.' }, { status: 400 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao gerar/enviar relatório'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
