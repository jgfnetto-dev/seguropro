import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: usuario } = await supabase.from('usuarios').select('corretora_id').eq('id', session.user.id).single()
  const corretora_id = usuario?.corretora_id

  const mes = req.nextUrl.searchParams.get('mes')
  const ano = req.nextUrl.searchParams.get('ano')
  const hoje = new Date()
  const m = mes ? parseInt(mes) : hoje.getMonth()
  const a = ano ? parseInt(ano) : hoje.getFullYear()

  const inicio = new Date(a, m, 1).toISOString().split('T')[0]
  const fim = new Date(a, m + 1, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('apolices')
    .select('*, cliente:clientes(segurado, cpf_cnpj, telefone), seguradora:seguradoras(nome)')
    .eq('corretora_id', corretora_id)
    .gte('data_fim', inicio)
    .lte('data_fim', fim)
    .order('data_fim', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
