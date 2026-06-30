import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { extractPdfData } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No PDF file' }, { status: 400 })

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

  try {
    const extracted = await extractPdfData(base64)
    return NextResponse.json(extracted)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Extraction failed'
    console.error('[pdf-extract] erro:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
