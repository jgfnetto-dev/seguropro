import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

async function getCorretoraId(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  return data?.corretora_id ?? null
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('historico_renovacao')
    .select('*')
    .eq('corretora_id', corretora_id)
    .order('arquivado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apolice_id } = await req.json()
  if (!apolice_id) return NextResponse.json({ error: 'Informe a apólice.' }, { status: 400 })

  const { data: apolice, error: apoliceError } = await supabase
    .from('apolices')
    .select('*, cliente:clientes(*), seguradora:seguradoras(*)')
    .eq('id', apolice_id)
    .eq('corretora_id', corretora_id)
    .single()
  if (apoliceError || !apolice) return NextResponse.json({ error: 'Apólice não encontrada.' }, { status: 404 })

  const [{ data: statusRows }, { data: conciliacoes }, { data: endossos }, { data: documentos }] = await Promise.all([
    supabase.from('status_renovacao').select('*').eq('apolice_id', apolice_id).order('criado_em', { ascending: false }),
    supabase.from('conciliacao').select('*').eq('apolice_id', apolice_id).order('criado_em', { ascending: false }),
    supabase.from('endossos').select('*').eq('apolice_id', apolice_id).order('criado_em', { ascending: false }),
    supabase.from('documentos_apolice').select('*').eq('apolice_id', apolice_id).order('criado_em', { ascending: false }),
  ])

  const statusFinal = statusRows?.[0]?.status
  if (statusFinal !== 'Renovada' && statusFinal !== 'Cancelada') {
    return NextResponse.json({ error: 'Apólice só pode ser enviada ao histórico com status Renovada ou Cancelada.' }, { status: 400 })
  }

  const { cliente, seguradora, ...apoliceData } = apolice

  const { error: insertError } = await supabase.from('historico_renovacao').insert({
    corretora_id,
    numero_apolice: apolice.numero_apolice,
    status_final: statusFinal,
    apolice: apoliceData,
    cliente,
    seguradora: seguradora ?? null,
    conciliacoes: conciliacoes ?? [],
    endossos: endossos ?? [],
    status_renovacoes: statusRows ?? [],
    documentos: documentos ?? [],
  })
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  await Promise.all([
    supabase.from('conciliacao').delete().eq('apolice_id', apolice_id),
    supabase.from('endossos').delete().eq('apolice_id', apolice_id),
    supabase.from('status_renovacao').delete().eq('apolice_id', apolice_id),
    supabase.from('documentos_apolice').delete().eq('apolice_id', apolice_id),
  ])

  const { error: deleteApoliceError } = await supabase.from('apolices').delete().eq('id', apolice_id).eq('corretora_id', corretora_id)
  if (deleteApoliceError) return NextResponse.json({ error: deleteApoliceError.message }, { status: 500 })

  const { count: outrasApolices } = await supabase
    .from('apolices')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', apolice.cliente_id)
    .eq('corretora_id', corretora_id)

  let clienteRemovido = false
  if (!outrasApolices) {
    const { error: clienteError } = await supabase.from('clientes').delete().eq('id', apolice.cliente_id).eq('corretora_id', corretora_id)
    if (!clienteError) clienteRemovido = true
  }

  return NextResponse.json({ success: true, clienteRemovido })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const corretora_id = await getCorretoraId(supabase)
  if (!corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  const mes = req.nextUrl.searchParams.get('mes')
  const ano = req.nextUrl.searchParams.get('ano')

  if (id) {
    const { error } = await supabase.from('historico_renovacao').delete().eq('id', id).eq('corretora_id', corretora_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, excluidos: 1 })
  }

  if (mes && ano) {
    const mesNum = parseInt(mes)
    const anoNum = parseInt(ano)
    const { data: registros, error: fetchError } = await supabase
      .from('historico_renovacao')
      .select('id, apolice')
      .eq('corretora_id', corretora_id)
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const idsParaExcluir = (registros ?? [])
      .filter((r) => {
        const dataFim = r.apolice?.data_fim
        if (!dataFim) return false
        const d = new Date(dataFim)
        return d.getMonth() + 1 === mesNum && d.getFullYear() === anoNum
      })
      .map((r) => r.id)

    if (!idsParaExcluir.length) return NextResponse.json({ success: true, excluidos: 0 })

    const { error: deleteError } = await supabase.from('historico_renovacao').delete().in('id', idsParaExcluir).eq('corretora_id', corretora_id)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
    return NextResponse.json({ success: true, excluidos: idsParaExcluir.length })
  }

  return NextResponse.json({ error: 'Informe id ou mes/ano.' }, { status: 400 })
}
