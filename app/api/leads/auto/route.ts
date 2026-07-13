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

  // Notifica o admin da corretora via WhatsApp (best-effort)
  // Seleciona apenas telefone_whatsapp para evitar erro caso whatsapp_instance
  // ainda não exista na tabela (migration pendente)
  try {
    const { data: admin, error: adminError } = await service
      .from('usuarios')
      .select('telefone_whatsapp')
      .eq('corretora_id', corretoraId)
      .eq('adm', 'S')
      .single()

    if (adminError) {
      console.error('[leads/auto] Erro ao buscar admin:', adminError.message)
    } else if (!admin) {
      console.warn('[leads/auto] Admin não encontrado para corretora:', corretoraId)
    } else if (!admin.telefone_whatsapp) {
      console.warn('[leads/auto] Admin sem WhatsApp configurado no perfil, corretora:', corretoraId)
    } else {
      const instance = process.env.EVOLUTION_INSTANCE
      if (!instance) {
        console.warn('[leads/auto] EVOLUTION_INSTANCE não configurado')
      } else {
        const placa = fields.placaChassi ? `\n🚗 Placa/Chassi: ${fields.placaChassi}` : ''
        const texto =
          `🔔 *Novo lead de cotação — Automóvel*\n\n` +
          `👤 Nome: ${fields.nome}\n` +
          `📱 Celular: ${fields.celular}\n` +
          `📧 E-mail: ${fields.email || 'Não informado'}` +
          placa
        console.log('[leads/auto] Enviando WhatsApp para:', admin.telefone_whatsapp, 'via instância:', instance)
        await sendWhatsAppMessage(admin.telefone_whatsapp, texto, instance)
        console.log('[leads/auto] WhatsApp enviado com sucesso')
      }
    }
  } catch (waError) {
    console.error('[leads/auto] Erro ao enviar notificação WhatsApp:', waError instanceof Error ? waError.message : waError)
  }

  return NextResponse.json({ success: true })
}
