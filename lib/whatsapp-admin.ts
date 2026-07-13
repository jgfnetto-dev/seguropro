import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

interface AdminData {
  telefone: string | null
  instance: string | null
  email: string | null
  nome: string | null
  adminId: string | null
  corretoraId: string | null
}

export async function getAdminWhatsApp(
  supabase: SupabaseClient,
  userId: string
): Promise<AdminData> {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', userId)
    .single()

  if (!usuario?.corretora_id) return { telefone: null, instance: null, email: null, nome: null, adminId: null, corretoraId: null }

  const service = createServiceClient()
  const { data: admin } = await service
    .from('usuarios')
    .select('id, telefone_whatsapp, telefone_notificacao, email, nome, whatsapp_instance')
    .eq('corretora_id', usuario.corretora_id)
    .eq('adm', 'S')
    .single()

  return {
    // telefone_notificacao is a separate number that avoids the self-message problem
    telefone: admin?.telefone_notificacao ?? admin?.telefone_whatsapp ?? null,
    instance: admin?.whatsapp_instance ?? process.env.EVOLUTION_INSTANCE ?? null,
    email: admin?.email ?? null,
    nome: admin?.nome ?? null,
    adminId: admin?.id ?? null,
    corretoraId: usuario.corretora_id,
  }
}
