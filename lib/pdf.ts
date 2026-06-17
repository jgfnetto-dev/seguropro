import PDFDocument from 'pdfkit'
import { formatDate } from '@/lib/utils'

interface ApoliceRenovacao {
  numero_apolice: string
  data_fim: string
  cliente?: { segurado: string }
  seguradora?: { nome: string }
}

export function gerarPdfRenovacoes(apolices: ApoliceRenovacao[], mesNome: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(18).fillColor('#00288e').text('SeguroPro', { align: 'left' })
    doc.fontSize(14).fillColor('#1a1b22').text(`Renovações — ${mesNome}`)
    doc.moveDown(1)

    doc.fontSize(10).fillColor('#444653')
    apolices.forEach((a, i) => {
      doc.fillColor('#1a1b22').fontSize(11).text(`${i + 1}. ${a.cliente?.segurado ?? '—'}`, { continued: false })
      doc
        .fontSize(10)
        .fillColor('#444653')
        .text(`   Apólice: ${a.numero_apolice}    Vence: ${formatDate(a.data_fim)}    Seguradora: ${a.seguradora?.nome ?? '—'}`)
      doc.moveDown(0.5)
    })

    doc.moveDown(1)
    doc.fontSize(11).fillColor('#1a1b22').text(`Total: ${apolices.length} apólice(s) para renovar.`)

    doc.end()
  })
}
