import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { sendWhatsAppDocument } from '@/lib/evolution'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  const corretora_id = usuario?.corretora_id
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apolice_id, telefone } = await req.json()
  if (!apolice_id || !telefone) {
    return NextResponse.json({ error: 'Informe a apólice e o WhatsApp do cliente.' }, { status: 400 })
  }

  const { data: apolice, error: apoliceError } = await supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado, email)')
    .eq('id', apolice_id)
    .eq('corretora_id', corretora_id)
    .single()
  if (apoliceError || !apolice) return NextResponse.json({ error: 'Apólice não encontrada.' }, { status: 404 })
  if (!apolice.pdf_url) return NextResponse.json({ error: 'Esta apólice não possui um PDF anexado.' }, { status: 400 })

  try {
    const pdfRes = await fetch(apolice.pdf_url)
    if (!pdfRes.ok) throw new Error('Não foi possível obter o PDF da apólice.')
    const base64 = Buffer.from(await pdfRes.arrayBuffer()).toString('base64')
    const fileName = `apolice-${apolice.numero_apolice}.pdf`
    const nomeCliente = apolice.cliente?.segurado ?? 'Cliente'

    const caption = `Olá, ${nomeCliente}! 😊\n\nMuito obrigado pela confiança! Segue em anexo a sua apólice nº ${apolice.numero_apolice}.\n\nEla também será enviada para o seu e-mail, para que fique guardada com você.\n\nQualquer dúvida, estamos à disposição!`
    await sendWhatsAppDocument(telefone, base64, fileName, caption)

    let emailEnviado = false
    if (apolice.cliente?.email) {
      await sendEmail({
        to: apolice.cliente.email,
        subject: `Sua apólice nº ${apolice.numero_apolice} — SeguroPro`,
        html: `<p>Olá, ${nomeCliente}!</p><p>Muito obrigado pela confiança! Segue em anexo a sua apólice nº ${apolice.numero_apolice}.</p><p>Qualquer dúvida, estamos à disposição!</p>`,
        attachmentBase64: base64,
        attachmentFilename: fileName,
      })
      emailEnviado = true
    }

    return NextResponse.json({ success: true, emailEnviado })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao enviar a apólice.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
