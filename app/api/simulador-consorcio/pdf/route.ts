import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', session.user.id)
    .single()

  let nomeCorretora = 'SeguroPro'
  let logoUrl: string | null = null
  if (usuario?.corretora_id) {
    const service = createServiceClient()
    const { data: corretora } = await service
      .from('corretoras')
      .select('nome, logo_url')
      .eq('id', usuario.corretora_id)
      .single()
    if (corretora?.nome) nomeCorretora = corretora.nome
    if (corretora?.logo_url) logoUrl = corretora.logo_url
  }

  const { params, resultado } = await req.json()

  const pdfDoc = await PDFDocument.create()
  const W = 595, H = 842
  const page = pdfDoc.addPage([W, H])
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  function moeda(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  const mL = 55
  const mR = 55
  const tW = W - mL - mR
  const rX = W - mR

  function textRight(text: string, yy: number, font: typeof bold, size: number, color: ReturnType<typeof rgb>) {
    const w = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: rX - w, y: yy, size, font, color })
  }

  // ─── HEADER ───────────────────────────────────────────────────────────
  const hH = 95
  const hBot = H - hH  // y at bottom of header

  // Right panel: dark charcoal (full width, drawn first)
  page.drawRectangle({ x: 0, y: hBot, width: W, height: hH, color: rgb(0.18, 0.22, 0.28) })

  // Left panel: very dark navy, trapezoid shape (wider at top → diagonal separator)
  // Bottom edge: x=0..200, Top edge: x=0..240
  try {
    page.drawSvgPath(`M 0 ${hBot} L 200 ${hBot} L 240 ${H} L 0 ${H} Z`, {
      color: rgb(0.04, 0.06, 0.12),
    })
  } catch {
    page.drawRectangle({ x: 0, y: hBot, width: 220, height: hH, color: rgb(0.04, 0.06, 0.12) })
  }

  // Logo ou bloco SP + nome
  let logoEmbedded = false
  if (logoUrl) {
    try {
      const imgRes = await fetch(logoUrl)
      const contentType = imgRes.headers.get('content-type') ?? ''
      const imgBytes = await imgRes.arrayBuffer()

      let embeddedImage
      if (contentType.includes('png') || logoUrl.toLowerCase().includes('.png')) {
        embeddedImage = await pdfDoc.embedPng(imgBytes)
      } else if (
        contentType.includes('jpeg') || contentType.includes('jpg') ||
        logoUrl.toLowerCase().includes('.jpg') || logoUrl.toLowerCase().includes('.jpeg')
      ) {
        embeddedImage = await pdfDoc.embedJpg(imgBytes)
      }

      if (embeddedImage) {
        // Centraliza a logo na área esquerda do header (x:0-200, altura:95)
        const maxW = 170, maxH = 65
        const { width: iW, height: iH } = embeddedImage
        const scale = Math.min(maxW / iW, maxH / iH)
        const dW = iW * scale, dH = iH * scale
        const dX = 15 + (maxW - dW) / 2
        const dY = hBot + (hH - dH) / 2
        page.drawImage(embeddedImage, { x: dX, y: dY, width: dW, height: dH })
        logoEmbedded = true
      }
    } catch {
      // falha silenciosa → fallback abaixo
    }
  }

  if (!logoEmbedded) {
    // Fallback: caixa SP azul + nome da corretora
    page.drawRectangle({ x: 22, y: hBot + 25, width: 44, height: 48, color: rgb(0.20, 0.48, 0.95) })
    const spW = bold.widthOfTextAtSize('SP', 20)
    page.drawText('SP', { x: 22 + (44 - spW) / 2, y: hBot + 39, size: 20, font: bold, color: rgb(1, 1, 1) })
    page.drawText(nomeCorretora, { x: 72, y: hBot + 50, size: 13, font: bold, color: rgb(1, 1, 1) })
  }

  // Right panel title, vertically centered
  page.drawText('Simulação de Consórcio', { x: 260, y: hBot + 38, size: 14, font: regular, color: rgb(0.80, 0.85, 0.92) })

  // ─── TABLE ────────────────────────────────────────────────────────────
  const dark = rgb(0.07, 0.09, 0.14)
  const muted = rgb(0.28, 0.34, 0.42)
  const subBlue = rgb(0.10, 0.32, 0.72)
  const sepClr = rgb(0.78, 0.82, 0.87)

  function hline(yy: number) {
    page.drawLine({ start: { x: mL, y: yy }, end: { x: rX, y: yy }, thickness: 0.4, color: sepClr })
  }

  let y = hBot - 48  // start below header

  // ── ROW 1: Crédito Contratado ─────────────────────────────────────────
  hline(y + 4)
  y -= 32
  page.drawText('Crédito Contratado', { x: mL, y: y + 9, size: 11, font: bold, color: dark })
  textRight(moeda(resultado.credito), y + 9, bold, 13, dark)
  hline(y - 4)

  // ── ROW 2: Tipo de contratação ────────────────────────────────────────
  y -= 28
  page.drawText('Tipo de contratação', { x: mL + 20, y: y + 9, size: 10, font: regular, color: subBlue })
  textRight(params.tipo === 'fisica' ? 'Física' : 'Jurídica', y + 9, bold, 10, dark)
  hline(y - 3)

  // ── ROW 3: Quantidade de parcelas ─────────────────────────────────────
  y -= 28
  page.drawText('Quantidade de parcelas', { x: mL + 20, y: y + 9, size: 10, font: regular, color: subBlue })
  textRight(`${params.parcelas}`, y + 9, bold, 10, dark)
  hline(y - 3)

  // ── ROW 4: Redutor do grupo ───────────────────────────────────────────
  y -= 28
  page.drawText('Redutor do grupo', { x: mL + 20, y: y + 9, size: 10, font: regular, color: subBlue })
  textRight(`${params.redutor}%`, y + 9, regular, 10, dark)
  hline(y - 3)

  // ── ROW 5: Economia mensal com redutor (green-boxed value) ────────────
  y -= 34
  page.drawText('Economia mensal com redutor', { x: mL, y: y + 11, size: 11, font: bold, color: dark })

  const econStr = moeda(resultado.economiaMensal)
  const econTW = bold.widthOfTextAtSize(econStr, 11)
  const bPad = 6
  const boxW = econTW + bPad * 2
  const boxH = 22
  const boxX = rX - boxW
  const boxY = y - 1
  page.drawRectangle({ x: boxX, y: boxY, width: boxW, height: boxH, color: rgb(1, 1, 1), borderColor: rgb(0.09, 0.58, 0.33), borderWidth: 1.5 })
  page.drawText(econStr, { x: boxX + bPad, y: boxY + 6, size: 11, font: bold, color: rgb(0.07, 0.44, 0.25) })
  hline(y - 6)

  // ── ROW 6: Valor da Parcela normal ────────────────────────────────────
  y -= 30
  page.drawText('Valor da Parcela normal', { x: mL, y: y + 9, size: 10, font: regular, color: muted })
  textRight(moeda(resultado.valorParcelaNormal), y + 9, regular, 10, muted)
  hline(y - 4)

  // ── ROW 7: Valor da parcela — final blue row ──────────────────────────
  y -= 38
  page.drawRectangle({ x: mL, y: y - 2, width: tW, height: 38, color: rgb(0.13, 0.40, 0.86) })
  page.drawText('Valor da parcela', { x: mL + 10, y: y + 11, size: 12, font: bold, color: rgb(1, 1, 1) })
  textRight(moeda(resultado.parcelaComRedutor), y + 9, bold, 15, rgb(1, 1, 1))

  // ── SEÇÃO: Oferta de Lance ────────────────────────────────────────────
  if (resultado.representatividadeLance != null) {
    // Título da seção
    y -= 24
    page.drawText('OFERTA DE LANCE', { x: mL, y: y + 6, size: 8, font: bold, color: rgb(0.50, 0.55, 0.65) })
    hline(y - 2)

    if (resultado.recursosProprios > 0) {
      y -= 26
      page.drawText('Recursos Próprios', { x: mL + 20, y: y + 8, size: 10, font: regular, color: subBlue })
      textRight(moeda(resultado.recursosProprios), y + 8, regular, 10, dark)
      hline(y - 3)
    }

    if (resultado.recursosCredito > 0) {
      y -= 26
      page.drawText('Recurso do Crédito (lance embutido)', { x: mL + 20, y: y + 8, size: 10, font: regular, color: subBlue })
      textRight(moeda(resultado.recursosCredito), y + 8, regular, 10, dark)
      hline(y - 3)
    }

    // Representatividade — fundo âmbar
    y -= 36
    page.drawRectangle({ x: mL, y: y - 2, width: tW, height: 36, color: rgb(0.99, 0.95, 0.80) })
    page.drawText('Representatividade do Lance', { x: mL + 10, y: y + 11, size: 11, font: bold, color: rgb(0.55, 0.38, 0.05) })
    const repStr = `${resultado.representatividadeLance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
    textRight(repStr, y + 10, bold, 14, rgb(0.55, 0.35, 0.03))
  }

  // ── SEÇÃO: Estimativa Pós-Contemplação ───────────────────────────────
  if (resultado.estimativa) {
    const est = resultado.estimativa

    y -= 22
    page.drawText('ESTIMATIVA PÓS-CONTEMPLAÇÃO', { x: mL, y: y + 6, size: 8, font: bold, color: rgb(0.50, 0.55, 0.65) })
    hline(y - 2)

    // Contemplação na parcela (sub)
    y -= 26
    page.drawText('Contemplação na parcela', { x: mL + 20, y: y + 8, size: 10, font: regular, color: subBlue })
    textRight(`${params.contemplacao}`, y + 8, bold, 10, dark)
    hline(y - 3)

    // Crédito Liberado — fundo azul
    y -= 34
    page.drawRectangle({ x: mL, y: y - 2, width: tW, height: 34, color: rgb(0.13, 0.40, 0.86) })
    page.drawText('Crédito liberado', { x: mL + 10, y: y + 10, size: 11, font: bold, color: rgb(1, 1, 1) })
    textRight(moeda(est.creditoLiberado), y + 10, bold, 12, rgb(1, 1, 1))

    // Nova Parcela
    y -= 28
    page.drawText('Nova parcela', { x: mL, y: y + 8, size: 10, font: regular, color: muted })
    textRight(moeda(est.novaParcela), y + 8, regular, 10, dark)
    hline(y - 3)

    // Com prazo de
    y -= 26
    page.drawText('Com prazo de', { x: mL, y: y + 8, size: 10, font: regular, color: muted })
    textRight(`${est.comPrazoDe}`, y + 8, regular, 10, dark)
    hline(y - 3)

    // Somente prazo (opcional)
    if (est.somentePrazo != null) {
      y -= 26
      page.drawText('Se preferir reduzir somente o prazo', { x: mL, y: y + 8, size: 10, font: regular, color: muted })
      textRight(`${est.somentePrazo}`, y + 8, bold, 10, dark)
      hline(y - 3)
    }
  }

  // ─── FOOTER ───────────────────────────────────────────────────────────
  const footerY = y - 28
  page.drawText(
    `Simulação gerada em ${new Date().toLocaleDateString('pt-BR')}  •  Valores sujeitos a aprovação da administradora de consórcio.`,
    { x: mL, y: footerY, size: 8, font: regular, color: rgb(0.55, 0.60, 0.68) },
  )

  const pdfBytes = await pdfDoc.save()
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="simulacao-consorcio.pdf"',
    },
  })
}
