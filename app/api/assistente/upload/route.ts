import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id, adm')
    .eq('id', session.user.id)
    .single()

  if (!usuario?.corretora_id) return NextResponse.json({ error: 'Corretora não encontrada.' }, { status: 400 })
  if (usuario.adm !== 'S') return NextResponse.json({ error: 'Apenas administradores podem fazer upload.' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('pdf') as File | null
  const seguradora = formData.get('seguradora') as string | null
  const nome = formData.get('nome') as string | null

  if (!file || !seguradora || !nome) {
    return NextResponse.json({ error: 'Informe o arquivo PDF, seguradora e nome.' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>
    const parsed = await pdfParse(buffer)
    const texto = parsed.text.trim()
    const paginas = parsed.numpages

    if (!texto) {
      return NextResponse.json({
        error: 'Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.',
      }, { status: 400 })
    }

    const { data: doc, error } = await supabase
      .from('assistente_docs')
      .insert({ corretora_id: usuario.corretora_id, seguradora, nome, texto, paginas })
      .select('id, seguradora, nome, paginas, criado_em')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar PDF.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
