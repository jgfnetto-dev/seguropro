import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatDate } from '@/lib/utils'

interface ApoliceRenovacao {
  numero_apolice: string
  data_fim: string
  cliente?: { segurado: string }
  seguradora?: { nome: string }
  status?: string
}

const PAGE_WIDTH = 841.89 // A4 landscape
const PAGE_HEIGHT = 595.28
const MARGIN = 40
const ROW_HEIGHT = 22

const COLUNAS = [
  { label: 'Cliente', width: 220 },
  { label: 'Nº Apólice', width: 130 },
  { label: 'Vence em', width: 100 },
  { label: 'Seguradora', width: 180 },
  { label: 'Status da Renovação', width: 132 },
]

function truncar(texto: string, maxChars: number) {
  return texto.length > maxChars ? `${texto.slice(0, maxChars - 1)}…` : texto
}

export async function gerarPdfRenovacoes(apolices: ApoliceRenovacao[], mesNome: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function novaPagina() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
    desenharCabecalhoTabela()
  }

  function desenharCabecalhoTabela() {
    let x = MARGIN
    page.drawRectangle({
      x: MARGIN,
      y: y - ROW_HEIGHT + 6,
      width: COLUNAS.reduce((sum, c) => sum + c.width, 0),
      height: ROW_HEIGHT,
      color: rgb(0.0, 0.157, 0.557),
    })
    COLUNAS.forEach((col) => {
      page.drawText(col.label, { x: x + 6, y: y - ROW_HEIGHT + 12, size: 10, font: fontBold, color: rgb(1, 1, 1) })
      x += col.width
    })
    y -= ROW_HEIGHT
  }

  function desenharLinha(valores: string[], par: boolean) {
    if (y - ROW_HEIGHT < MARGIN) {
      novaPagina()
    }
    let x = MARGIN
    const larguraTotal = COLUNAS.reduce((sum, c) => sum + c.width, 0)
    if (par) {
      page.drawRectangle({ x: MARGIN, y: y - ROW_HEIGHT + 6, width: larguraTotal, height: ROW_HEIGHT, color: rgb(0.96, 0.96, 0.97) })
    }
    valores.forEach((valor, i) => {
      const maxChars = Math.floor(COLUNAS[i].width / 5.5)
      page.drawText(truncar(valor, maxChars), { x: x + 6, y: y - ROW_HEIGHT + 12, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.13) })
      x += COLUNAS[i].width
    })
    y -= ROW_HEIGHT
  }

  page.drawText('SeguroPro', { x: MARGIN, y, size: 18, font: fontBold, color: rgb(0, 0.157, 0.557) })
  y -= 24
  page.drawText(`Renovações — ${mesNome}`, { x: MARGIN, y, size: 13, font: fontBold, color: rgb(0.1, 0.1, 0.13) })
  y -= 24

  desenharCabecalhoTabela()

  apolices.forEach((a, i) => {
    desenharLinha(
      [
        a.cliente?.segurado ?? '—',
        a.numero_apolice,
        formatDate(a.data_fim),
        a.seguradora?.nome ?? '—',
        a.status ?? 'Não Informado',
      ],
      i % 2 === 1
    )
  })

  y -= 16
  if (y < MARGIN) novaPagina()
  page.drawText(`Total: ${apolices.length} apólice(s) para renovar.`, { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.13) })

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}
