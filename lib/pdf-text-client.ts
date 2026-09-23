/**
 * Extração de texto de PDF no browser usando pdfjs-dist.
 * Elimina o envio do binário ao servidor para extração, reduzindo latência.
 */
export async function extractTextFromPdf(file: File, maxChars = 8000): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdf = await loadingTask.promise

  let fullText = ''
  const pagesToRead = Math.min(pdf.numPages, 5)

  for (let i = 1; i <= pagesToRead; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const items = content.items as Array<{ str?: string }>
    const pageText = items.map((item) => item.str ?? '').join(' ')
    fullText += pageText + '\n'
    if (fullText.length >= maxChars) break
  }

  return fullText.trim().slice(0, maxChars)
}
