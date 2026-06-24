import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import { formatDate, formatCurrency } from '@/lib/utils'

interface ApoliceRenovacao {
  numero_apolice: string
  data_fim: string
  cliente?: { segurado: string }
  seguradora?: { nome: string }
  status?: string
}

const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const PAGE_WIDTH = 841.89 // A4 landscape
const PAGE_HEIGHT = 595.28
const MARGIN = 40
const ROW_HEIGHT = 22
const CELL_PADDING = 6

const COLUNAS = [
  { label: 'Cliente', width: 220 },
  { label: 'Nº Apólice', width: 130 },
  { label: 'Vence em', width: 100 },
  { label: 'Seguradora', width: 180 },
  { label: 'Status da Renovação', width: 132 },
]

// Trunca o texto pela largura real renderizada (via métrica da fonte), evitando que
// o conteúdo de uma coluna invada visualmente a coluna seguinte.
function truncarPorLargura(font: PDFFont, texto: string, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(texto, size) <= maxWidth) return texto
  let resultado = texto
  while (resultado.length > 1 && font.widthOfTextAtSize(`${resultado}…`, size) > maxWidth) {
    resultado = resultado.slice(0, -1)
  }
  return `${resultado}…`
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
    const larguraTotal = COLUNAS.reduce((sum, c) => sum + c.width, 0)
    page.drawRectangle({
      x: MARGIN,
      y: y - ROW_HEIGHT + 6,
      width: larguraTotal,
      height: ROW_HEIGHT,
      color: rgb(0.0, 0.157, 0.557),
    })
    COLUNAS.forEach((col) => {
      page.drawText(col.label, { x: x + CELL_PADDING, y: y - ROW_HEIGHT + 12, size: 10, font: fontBold, color: rgb(1, 1, 1) })
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
      const maxWidth = COLUNAS[i].width - CELL_PADDING * 2
      const texto = truncarPorLargura(fontRegular, valor, 9.5, maxWidth)
      page.drawText(texto, { x: x + CELL_PADDING, y: y - ROW_HEIGHT + 12, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.13) })
      x += COLUNAS[i].width
    })
    y -= ROW_HEIGHT
  }

  function desenharCabecalhoMes(label: string) {
    if (y - (ROW_HEIGHT + 18) < MARGIN) {
      novaPagina()
    } else {
      y -= 10
    }
    page.drawText(label, { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0, 0.157, 0.557) })
    y -= 6
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + COLUNAS.reduce((sum, c) => sum + c.width, 0), y },
      thickness: 0.75,
      color: rgb(0, 0.157, 0.557),
    })
    y -= 12
    desenharCabecalhoTabela()
  }

  page.drawText('SeguroPro', { x: MARGIN, y, size: 18, font: fontBold, color: rgb(0, 0.157, 0.557) })
  y -= 24
  page.drawText(`Renovações — ${mesNome}`, { x: MARGIN, y, size: 13, font: fontBold, color: rgb(0.1, 0.1, 0.13) })
  y -= 24

  // Agrupa por mês/ano de vencimento. Se o período abranger só um mês, não repete
  // o rótulo (o título da página já deixa isso claro); com mais de um mês, cada
  // grupo recebe um cabeçalho "Mês/Ano" antes de suas linhas.
  const grupos = new Map<string, ApoliceRenovacao[]>()
  apolices.forEach((a) => {
    const chave = a.data_fim.slice(0, 7) // YYYY-MM
    const lista = grupos.get(chave) ?? []
    lista.push(a)
    grupos.set(chave, lista)
  })
  const chavesOrdenadas = Array.from(grupos.keys()).sort()
  const multiplosMeses = chavesOrdenadas.length > 1

  if (multiplosMeses) {
    chavesOrdenadas.forEach((chave) => {
      const [ano, mes] = chave.split('-')
      desenharCabecalhoMes(`${NOMES_MESES[parseInt(mes) - 1]}/${ano}`)
      grupos.get(chave)!.forEach((a, i) => {
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
    })
  } else {
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
  }

  y -= 16
  if (y < MARGIN) novaPagina()
  page.drawText(`Total: ${apolices.length} apólice(s) para renovar.`, { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.13) })

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}

interface ApoliceConciliacao {
  numero_apolice: string
  cpf_cnpj?: string
  cliente?: string
  data_emissao?: string | null
  data_inicio: string
  data_fim: string
  premio_liquido: number
  comissao_percentual?: number | null
  comissao: number
  conciliacoes: { data_conciliacao: string; valor_conciliar: number }[]
}

const COLUNAS_CONCILIACAO = [
  { label: 'Apólice', width: 80 },
  { label: 'CPF/CNPJ', width: 95 },
  { label: 'Cliente', width: 150 },
  { label: 'Emissão', width: 60 },
  { label: 'Início', width: 60 },
  { label: 'Fim', width: 60 },
  { label: 'Prêmio Líquido', width: 85 },
  { label: '% Comissão', width: 65 },
  { label: 'Comissão', width: 80 },
]

export async function gerarPdfConciliacao(apolices: ApoliceConciliacao[], periodoLabel: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const larguraTotal = COLUNAS_CONCILIACAO.reduce((sum, c) => sum + c.width, 0)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function novaPagina() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
    desenharCabecalhoTabela()
  }

  function desenharCabecalhoTabela() {
    let x = MARGIN
    page.drawRectangle({ x: MARGIN, y: y - ROW_HEIGHT + 6, width: larguraTotal, height: ROW_HEIGHT, color: rgb(0.0, 0.157, 0.557) })
    COLUNAS_CONCILIACAO.forEach((col) => {
      page.drawText(col.label, { x: x + CELL_PADDING, y: y - ROW_HEIGHT + 12, size: 9.5, font: fontBold, color: rgb(1, 1, 1) })
      x += col.width
    })
    y -= ROW_HEIGHT
  }

  function desenharLinha(valores: string[], par: boolean) {
    if (y - ROW_HEIGHT < MARGIN) novaPagina()
    let x = MARGIN
    if (par) {
      page.drawRectangle({ x: MARGIN, y: y - ROW_HEIGHT + 6, width: larguraTotal, height: ROW_HEIGHT, color: rgb(0.96, 0.96, 0.97) })
    }
    valores.forEach((valor, i) => {
      const maxWidth = COLUNAS_CONCILIACAO[i].width - CELL_PADDING * 2
      const texto = truncarPorLargura(fontRegular, valor, 9, maxWidth)
      page.drawText(texto, { x: x + CELL_PADDING, y: y - ROW_HEIGHT + 12, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.13) })
      x += COLUNAS_CONCILIACAO[i].width
    })
    y -= ROW_HEIGHT
  }

  function desenharLinhaConciliacao(texto: string) {
    const altura = 16
    if (y - altura < MARGIN) novaPagina()
    page.drawText(texto, { x: MARGIN + 16, y: y - altura + 11, size: 8.5, font: fontRegular, color: rgb(0.078, 0.42, 0.18) })
    y -= altura
  }

  function desenharCabecalhoMes(label: string) {
    if (y - (ROW_HEIGHT + 18) < MARGIN) {
      novaPagina()
    } else {
      y -= 10
    }
    page.drawText(label, { x: MARGIN, y, size: 12, font: fontBold, color: rgb(0, 0.157, 0.557) })
    y -= 6
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + larguraTotal, y }, thickness: 0.75, color: rgb(0, 0.157, 0.557) })
    y -= 12
    desenharCabecalhoTabela()
  }

  function desenharApolice(a: ApoliceConciliacao, par: boolean) {
    desenharLinha(
      [
        a.numero_apolice,
        a.cpf_cnpj ?? '—',
        a.cliente ?? '—',
        a.data_emissao ? formatDate(a.data_emissao) : '—',
        formatDate(a.data_inicio),
        formatDate(a.data_fim),
        formatCurrency(a.premio_liquido),
        `${a.comissao_percentual ?? 0}%`,
        formatCurrency(a.comissao),
      ],
      par
    )
    a.conciliacoes.forEach((c) => {
      desenharLinhaConciliacao(`- Conciliado em ${formatDate(c.data_conciliacao)} - ${formatCurrency(c.valor_conciliar)}`)
    })
  }

  page.drawText('SeguroPro', { x: MARGIN, y, size: 18, font: fontBold, color: rgb(0, 0.157, 0.557) })
  y -= 24
  page.drawText(`Conciliação — ${periodoLabel}`, { x: MARGIN, y, size: 13, font: fontBold, color: rgb(0.1, 0.1, 0.13) })
  y -= 24

  const grupos = new Map<string, ApoliceConciliacao[]>()
  apolices.forEach((a) => {
    const chave = (a.data_emissao ?? a.data_inicio).slice(0, 7) // YYYY-MM
    const lista = grupos.get(chave) ?? []
    lista.push(a)
    grupos.set(chave, lista)
  })
  const chavesOrdenadas = Array.from(grupos.keys()).sort()
  const multiplosMeses = chavesOrdenadas.length > 1

  if (multiplosMeses) {
    chavesOrdenadas.forEach((chave) => {
      const [ano, mes] = chave.split('-')
      desenharCabecalhoMes(`${NOMES_MESES[parseInt(mes) - 1]}/${ano}`)
      grupos.get(chave)!.forEach((a, i) => desenharApolice(a, i % 2 === 1))
    })
  } else {
    desenharCabecalhoTabela()
    apolices.forEach((a, i) => desenharApolice(a, i % 2 === 1))
  }

  y -= 16
  if (y < MARGIN) novaPagina()
  page.drawText(`Total: ${apolices.length} apólice(s).`, { x: MARGIN, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.13) })

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}
