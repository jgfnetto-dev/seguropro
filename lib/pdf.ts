import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatDate } from '@/lib/utils'

interface ApoliceRenovacao {
  numero_apolice: string
  data_fim: string
  cliente?: { segurado: string }
  seguradora?: { nome: string }
}

const PAGE_WIDTH = 595.28 // A4
const PAGE_HEIGHT = 841.89
const MARGIN = 40
const LINE_HEIGHT = 16

export async function gerarPdfRenovacoes(apolices: ApoliceRenovacao[], mesNome: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function novaLinha(altura = LINE_HEIGHT) {
    y -= altura
    if (y < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  page.drawText('SeguroPro', { x: MARGIN, y, size: 18, font: fontBold, color: rgb(0, 0.157, 0.557) })
  novaLinha(26)
  page.drawText(`Renovações — ${mesNome}`, { x: MARGIN, y, size: 13, font: fontBold, color: rgb(0.1, 0.1, 0.13) })
  novaLinha(24)

  apolices.forEach((a, i) => {
    page.drawText(`${i + 1}. ${a.cliente?.segurado ?? '—'}`, { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.13) })
    novaLinha(14)
    const detalhe = `Apólice: ${a.numero_apolice}    Vence: ${formatDate(a.data_fim)}    Seguradora: ${a.seguradora?.nome ?? '—'}`
    page.drawText(detalhe, { x: MARGIN + 12, y, size: 10, font: fontRegular, color: rgb(0.27, 0.27, 0.32) })
    novaLinha(18)
  })

  novaLinha(8)
  page.drawText(`Total: ${apolices.length} apólice(s) para renovar.`, { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.13) })

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}
