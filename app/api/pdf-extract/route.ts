import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { extractPdfData } from '@/lib/gemini'
import { PDFParse } from 'pdf-parse'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No PDF file' }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const { text } = await parser.getText()

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'PDF sem texto legível (pode ser escaneado/imagem)' }, { status: 422 })
    }

    const extracted = await extractPdfData(text)
    return NextResponse.json(extracted)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Extraction failed'
    console.error('[pdf-extract] erro:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
