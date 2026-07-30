import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendWhatsAppMessage } from '@/lib/evolution'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

  const { corretoraId, ...fields } = body

  if (!corretoraId || !fields.cpf || !fields.nome || !fields.celular) {
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

  const { error: insertError } = await service.from('leads_saude').insert({
    corretora_id: corretoraId,
    cpf: fields.cpf,
    nome: fields.nome,
    data_nascimento: fields.dataNascimento || null,
    celular: fields.celular,
    email: fields.email || null,
    tem_plano: fields.temPlano || null,
    plano_vigente: fields.planoVigente || null,
    tempo_plano: fields.tempoPlano || null,
    tipo_contratacao: fields.tipoContratacao || null,
    preferencia_hospital: fields.preferenciaHospital || null,
    em_tratamento: fields.emTratamento || null,
    descricao_tratamento: fields.descricaoTratamento || null,
    incluir_dependentes: fields.incluirDependentes || null,
  })

  if (insertError) {
    console.error('leads_saude insert error:', insertError)
    return NextResponse.json({ error: 'Erro ao salvar dados. Tente novamente.' }, { status: 500 })
  }

  // Notifica o admin via WhatsApp
  let waDebug = 'não executado'
  try {
    const { data: admin } = await service
      .from('usuarios')
      .select('telefone_notificacao, whatsapp_instance')
      .eq('corretora_id', corretoraId)
      .eq('adm', 'S')
      .single()

    const telefone = admin?.telefone_notificacao
    const instance = admin?.whatsapp_instance ?? process.env.EVOLUTION_INSTANCE

    if (!telefone) {
      waDebug = 'admin sem telefone_notificacao configurado'
    } else if (!instance) {
      waDebug = 'EVOLUTION_INSTANCE não configurado'
    } else {
      const texto =
        `🔔 *Novo lead — Plano de Saúde*\n\n` +
        `👤 Nome: ${fields.nome}\n` +
        `📱 Celular: ${fields.celular}\n` +
        `📧 E-mail: ${fields.email || 'Não informado'}\n` +
        `🏥 Tem plano atual: ${fields.temPlano === 'S' ? 'Sim' : 'Não'}`
      await sendWhatsAppMessage(telefone, texto, instance)
      waDebug = `enviado para ${telefone}`
    }
  } catch (waError) {
    waDebug = `exceção: ${waError instanceof Error ? waError.message : String(waError)}`
  }

  console.log('[leads/saude] waDebug:', waDebug)
  return NextResponse.json({ success: true, _wa: waDebug })
}
