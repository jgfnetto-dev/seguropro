import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

async function getCorretoraId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  return data?.corretora_id ?? null
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('endossos')
    .select('*')
    .eq('corretora_id', corretora_id)
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apolice_id, numero_apolice, numero_endosso, tipo_endosso, segurado, data_emissao, data_inicio, data_fim, pdf_url } = await req.json()
  if (!apolice_id || !numero_apolice || !numero_endosso) {
    return NextResponse.json({ error: 'Informe apólice e número do endosso.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('endossos')
    .insert({
      corretora_id,
      apolice_id,
      numero_apolice,
      numero_endosso,
      tipo_endosso: tipo_endosso ?? null,
      segurado: segurado ?? null,
      data_emissao: data_emissao ?? null,
      data_inicio: data_inicio ?? null,
      data_fim: data_fim ?? null,
      pdf_url: pdf_url ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
