import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/evolution'

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

  // Tenta inserir com colunas novas; se falhar por coluna inexistente, tenta sem elas
  let insertError: unknown = null

  const fullInsert = await service.from('leads_auto').insert({
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

  if (fullInsert.error) {
    // Colunas condutor_* podem não existir em produção — tenta sem elas
    const { error: fallbackError } = await service.from('leads_auto').insert({
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
      residente_18_25: fields.residente1825 || null,
      residente_usa_veiculo: fields.residente1825UsaVeiculo || null,
      km_mensal: fields.kmMensal || null,
    })
    if (fallbackError) {
      console.error('leads_auto insert error:', fallbackError)
      return NextResponse.json({ error: 'Erro ao salvar dados. Tente novamente.' }, { status: 500 })
    }
    insertError = fullInsert.error.message
  }

  // Notifica o admin via WhatsApp
  let waDebug = 'não executado'
  try {
    const { data: admin, error: adminError } = await service
      .from('usuarios')
      .select('telefone_notificacao')
      .eq('corretora_id', corretoraId)
      .eq('adm', 'S')
      .single()

    if (adminError) {
      waDebug = `erro ao buscar admin: ${adminError.message}`
    } else if (!admin) {
      waDebug = 'admin não encontrado'
    } else if (!admin.telefone_notificacao) {
      waDebug = 'admin sem telefone_notificacao configurado no perfil'
    } else {
      const instance = process.env.EVOLUTION_INSTANCE
      if (!instance) {
        waDebug = 'EVOLUTION_INSTANCE não configurado'
      } else {
        const placa = fields.placaChassi ? `\n🚗 Placa/Chassi: ${fields.placaChassi}` : ''
        const texto =
          `🔔 *Novo lead de cotação — Automóvel*\n\n` +
          `👤 Nome: ${fields.nome}\n` +
          `📱 Celular: ${fields.celular}\n` +
          `📧 E-mail: ${fields.email || 'Não informado'}` +
          placa
        await sendWhatsAppMessage(admin.telefone_notificacao, texto, instance)
        waDebug = `enviado para ${admin.telefone_notificacao} via ${instance}`
      }
    }
  } catch (waError) {
    waDebug = `exceção: ${waError instanceof Error ? waError.message : String(waError)}`
  }

  console.log('[leads/auto] waDebug:', waDebug, '| insertFallback:', insertError ?? 'não')
  return NextResponse.json({ success: true, _wa: waDebug, _insertFallback: insertError })
}
