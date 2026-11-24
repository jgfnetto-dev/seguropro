/**
 * Extração de texto de PDF no browser usando pdfjs-dist.
 * Estratégia: preenche o início do documento sequencialmente (headBudget),
 * depois anexa o rodapé de cada página não coberta integralmente.
 * Isso garante captura de dados em rodapés mesmo quando páginas densas
 * consumiriam todo o orçamento de caracteres antes do final do documento.
 */
export async function extractTextFromPdf(file: File, maxChars = 12000): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdf = await loadingTask.promise

  const pagesToRead = Math.min(pdf.numPages, 12)
  const pageTexts: string[] = []

  for (let i = 1; i <= pagesToRead; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const items = content.items as Array<{ str?: string }>
    pageTexts.push(items.map((item) => item.str ?? '').join(' '))
  }

  // Reserva 300 chars por página para rodapés; o restante vai para o início sequencial
  const TAIL = 300
  const headBudget = maxChars - TAIL * pagesToRead

  let head = ''
  const fullyIncluded = new Set<number>()
  for (let i = 0; i < pageTexts.length; i++) {
    if (head.length >= headBudget) break
    const space = headBudget - head.length
    head += pageTexts[i].slice(0, space) + '\n'
    if (pageTexts[i].length <= space) fullyIncluded.add(i)
  }

  // Anexa rodapé das páginas não cobertas integralmente
  let tails = ''
  for (let i = 0; i < pageTexts.length; i++) {
    if (fullyIncluded.has(i)) continue
    if (pageTexts[i].length > TAIL) tails += pageTexts[i].slice(-TAIL) + '\n'
  }

  return (head + tails).trim().slice(0, maxChars)
}
