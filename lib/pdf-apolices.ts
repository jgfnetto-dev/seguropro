import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface ApoliceParaPDF {
  numero_apolice: string
  cliente_nome: string
  seguradora_nome: string
  tipo_seguro: string
  data_emissao: string | null
  data_fim: string
  premio_liquido: number
  premio_total: number
}

function fmt(iso: string | null) {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function cur(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function status(dataFim: string): { label: string; r: number; g: number; b: number } {
  const diff = (new Date(dataFim).getTime() - Date.now()) / 86400000
  if (diff < 0) return { label: 'Vencida', r: 0.78, g: 0.18, b: 0.18 }
  if (diff <= 30) return { label: 'Vence breve', r: 0.80, g: 0.45, b: 0.0 }
  return { label: 'Ativa', r: 0.09, g: 0.57, b: 0.23 }
}

export async function gerarPDFApolices(
  apolices: ApoliceParaPDF[],
  filtrosLabel: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const regular = await doc.embedFont(StandardFonts.Helvetica)

  // A4 landscape
  const PW = 841.89, PH = 595.28
  const ML = 28, MR = 28, MT = 28, MB = 28
  const CW = PW - ML - MR

  // Columns: sum = 785 ≤ CW ~785
  const COLS = [
    { label: 'Nº Apólice',  w: 92, chars: 14 },
    { label: 'Cliente',      w: 155, chars: 26 },
    { label: 'Seguradora',   w: 100, chars: 15 },
    { label: 'Tipo',         w: 72,  chars: 11 },
    { label: 'Emissão',      w: 58,  chars: 9  },
    { label: 'Vencimento',   w: 62,  chars: 9  },
    { label: 'Pr. Líquido',  w: 78,  chars: 12 },
    { label: 'Pr. Total',    w: 78,  chars: 12 },
    { label: 'Status',       w: 90,  chars: 12 },
  ]

  const HDR_H = 20
  const ROW_H = 14
  const FS = 7.5

  let page = doc.addPage([PW, PH])
  let y = PH - MT

  function addPageHeader() {
    // Blue header bar
    page.drawRectangle({ x: ML, y: y - 24, width: CW, height: 24, color: rgb(0.08, 0.37, 0.73) })
    page.drawText('SeguroPro — Relatório de Apólices', {
      x: ML + 10, y: y - 16, size: 12, font: bold, color: rgb(1, 1, 1),
    })
    const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    page.drawText(`${now}  |  ${apolices.length} apólice${apolices.length !== 1 ? 's' : ''}  |  ${filtrosLabel}`, {
      x: ML + 360, y: y - 16, size: 7, font: regular, color: rgb(0.85, 0.90, 1),
    })
    y -= 24 + 3

    // Column header row
    page.drawRectangle({ x: ML, y: y - HDR_H + 4, width: CW, height: HDR_H, color: rgb(0.20, 0.30, 0.50) })
    let x = ML + 4
    for (const col of COLS) {
      page.drawText(col.label, { x, y: y - 13, size: 7.5, font: bold, color: rgb(1, 1, 1) })
      x += col.w
    }
    y -= HDR_H + 1
  }

  addPageHeader()

  let totalLiq = 0, totalTot = 0

  for (let i = 0; i < apolices.length; i++) {
    if (y - ROW_H < MB + 25) {
      page = doc.addPage([PW, PH])
      y = PH - MT
      addPageHeader()
    }

    const a = apolices[i]
    const st = status(a.data_fim)

    if (i % 2 === 1) {
      page.drawRectangle({ x: ML, y: y - ROW_H + 3, width: CW, height: ROW_H, color: rgb(0.95, 0.96, 0.99) })
    }

    const cells = [
      truncate(a.numero_apolice, COLS[0].chars),
      truncate(a.cliente_nome,   COLS[1].chars),
      truncate(a.seguradora_nome,COLS[2].chars),
      truncate(a.tipo_seguro,    COLS[3].chars),
      fmt(a.data_emissao),
      fmt(a.data_fim),
      cur(a.premio_liquido),
      cur(a.premio_total),
    ]

    let x = ML + 4
    for (let c = 0; c < cells.length; c++) {
      page.drawText(cells[c], { x, y: y - 9, size: FS, font: regular, color: rgb(0.15, 0.15, 0.15) })
      x += COLS[c].w
    }

    // Status pill
    page.drawRectangle({ x: x + 1, y: y - 11, width: COLS[8].w - 8, height: 11, color: rgb(st.r, st.g, st.b) })
    page.drawText(st.label, { x: x + 4, y: y - 8, size: 6.5, font: bold, color: rgb(1, 1, 1) })

    totalLiq += a.premio_liquido
    totalTot += a.premio_total
    y -= ROW_H + 1
  }

  // Footer summary
  if (y - 18 < MB) {
    page = doc.addPage([PW, PH])
    y = PH - MT
  }
  y -= 6
  page.drawLine({ start: { x: ML, y }, end: { x: PW - MR, y }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) })
  y -= 13
  page.drawText(`Total: ${apolices.length} apólice${apolices.length !== 1 ? 's' : ''}`, {
    x: ML, y, size: 8.5, font: bold, color: rgb(0.2, 0.2, 0.2),
  })
  page.drawText(`Prêmio Líquido Total: ${cur(totalLiq)}`, {
    x: ML + 180, y, size: 8.5, font: regular, color: rgb(0.2, 0.2, 0.2),
  })
  page.drawText(`Prêmio Total: ${cur(totalTot)}`, {
    x: ML + 450, y, size: 8.5, font: bold, color: rgb(0.08, 0.37, 0.73),
  })

  return doc.save()
}
