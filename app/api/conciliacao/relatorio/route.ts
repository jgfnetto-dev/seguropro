import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWhatsAppDocument } from '@/lib/evolution'
import { sendEmail } from '@/lib/email'
import { gerarPdfConciliacao } from '@/lib/pdf'
import { formatCpfCnpj } from '@/lib/utils'
import { getAdminWhatsApp } from '@/lib/whatsapp-admin'

const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { mesInicio, anoInicio, mesFim, anoFim, canal, email } = await req.json()
  if (!mesInicio || !anoInicio || !mesFim || !anoFim || !canal) {
    return NextResponse.json({ error: 'Informe o período (mês/ano início e fim) e o canal de envio.' }, { status: 400 })
  }

  const inicio = `${anoInicio}-${String(mesInicio).padStart(2, '0')}-01`
  const ultimoDiaFim = new Date(anoFim, mesFim, 0).getDate()
  const fim = `${anoFim}-${String(mesFim).padStart(2, '0')}-${String(ultimoDiaFim).padStart(2, '0')}`

  if (fim < inicio) {
    return NextResponse.json({ error: 'O período final não pode ser anterior ao período inicial.' }, { status: 400 })
  }

  const { data: apolices } = await supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado, cpf_cnpj)')
    .gte('data_emissao', inicio)
    .lte('data_emissao', fim)
    .order('data_emissao', { ascending: true })

  if (!apolices?.length) {
    return NextResponse.json({ error: 'Nenhuma apólice com emissão nesse período.' }, { status: 400 })
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

  const labelPeriodo = mesInicio === mesFim && anoInicio === anoFim
    ? `${NOMES_MESES[mesInicio - 1]}/${anoInicio}`
    : `${NOMES_MESES[mesInicio - 1]}/${anoInicio} a ${NOMES_MESES[mesFim - 1]}/${anoFim}`

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
    const pdfBuffer = await gerarPdfConciliacao(apolicesParaPdf, labelPeriodo)
    const base64 = pdfBuffer.toString('base64')
    const nomeArquivo = `conciliacao-${labelPeriodo.replace(/\//g, '-').replace(/\s/g, '')}.pdf`

    if (canal === 'whatsapp') {
      const { telefone } = await getAdminWhatsApp(supabase, session.user.id)
      if (!telefone) {
        return NextResponse.json({ error: 'Telefone WhatsApp não configurado para o administrador da corretora.' }, { status: 400 })
      }
      const caption = `📊 *Relatório de Conciliação — ${labelPeriodo}*\nTotal: ${apolices.length} apólice(s).`
      await sendWhatsAppDocument(telefone, base64, nomeArquivo, caption)
      return NextResponse.json({ success: true, canal: 'whatsapp', total: apolices.length })
    }

    if (canal === 'email') {
      const destinatario = email || session.user.email
      if (!destinatario) {
        return NextResponse.json({ error: 'Informe um e-mail de destino.' }, { status: 400 })
      }
      await sendEmail({
        to: destinatario,
        subject: `Relatório de Conciliação — ${labelPeriodo}`,
        html: `<p>Olá,</p><p>Segue em anexo o relatório de conciliação de comissões com emissão no período de <strong>${labelPeriodo}</strong>.</p><p>Total: ${apolices.length} apólice(s).</p><p>SeguroPro</p>`,
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
