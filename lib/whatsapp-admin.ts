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
  // Get the corretora_id of the logged-in user (RLS allows reading own row)
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', userId)
    .single()

  if (!usuario?.corretora_id) return { telefone: null, instance: null, email: null, nome: null, adminId: null, corretoraId: null }

  // Use service client to bypass RLS (the admin row belongs to a different user)
  const service = createServiceClient()
  const { data: admin } = await service
    .from('usuarios')
    .select('id, telefone_whatsapp, email, nome')
    .eq('corretora_id', usuario.corretora_id)
    .eq('adm', 'S')
    .single()

  return {
    telefone: admin?.telefone_whatsapp ?? null,
    instance: process.env.EVOLUTION_INSTANCE ?? null,
    email: admin?.email ?? null,
    nome: admin?.nome ?? null,
    adminId: admin?.id ?? null,
    corretoraId: usuario.corretora_id,
  }
}
