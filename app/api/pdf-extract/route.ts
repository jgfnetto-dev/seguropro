import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { extractPdfData } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pdf } = await req.json()
  if (!pdf) return NextResponse.json({ error: 'No PDF data' }, { status: 400 })

  try {
    const extracted = await extractPdfData(pdf)
    return NextResponse.json(extracted)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Extraction failed'
    console.error('[pdf-extract] erro:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
