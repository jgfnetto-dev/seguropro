import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

  const { corretoraId, ...fields } = body

  if (!corretoraId || !fields.nome || !fields.cpf || !fields.celular) {
    return NextResponse.json({ error: 'Campos obrigatórios não informados.' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: corretora } = await service
    .from('corretoras')
    .select('id')
    .eq('id', corretoraId)
    .single()

  if (!corretora) {
    return NextResponse.json({ error: 'Link inválido.' }, { status: 404 })
  }

  const { error } = await service.from('leads_auto').insert({
    corretora_id: corretoraId,
    nome: fields.nome,
    cpf: fields.cpf,
    email: fields.email || null,
    celular: fields.celular,
    placa_chassi: fields.placaChassi || null,
    cep_pernoite: fields.cepPernoite || null,
    endereco_completo: fields.enderecoCompleto || null,
    estado_civil: fields.estadoCivil || null,
    tipo_residencia: fields.tipoResidencia || null,
    tem_garagem: fields.temGaragem || null,
    tipo_portao: fields.tipoPortao || null,
    usa_trabalho: fields.usaTrabalho || null,
    estacionamento_trabalho: fields.estacionamentoTrabalho || null,
    usa_estudo: fields.usaEstudo || null,
    estacionamento_estudo: fields.estacionamentoEstudo || null,
    uso_veiculo: fields.usoVeiculo || null,
    condutor_e_segurado: fields.condutorESegurado || null,
    condutor_cpf: fields.condutorCpf || null,
    condutor_nascimento: fields.condutorNascimento || null,
    residente_18_25: fields.residente1825 || null,
    residente_usa_veiculo: fields.residente1825UsaVeiculo || null,
    km_mensal: fields.kmMensal || null,
  })

  if (error) {
    console.error('leads_auto insert error:', error)
    return NextResponse.json({ error: 'Erro ao salvar dados. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
