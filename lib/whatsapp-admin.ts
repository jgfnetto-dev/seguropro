import { createServerSupabaseClient } from '@/lib/supabase'

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

export async function getAdminWhatsApp(
  supabase: SupabaseClient,
  userId: string
): Promise<{ telefone: string | null; adminId: string | null; corretoraId: string | null }> {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', userId)
    .single()

  if (!usuario?.corretora_id) return { telefone: null, adminId: null, corretoraId: null }

  const { data: admin } = await supabase
    .from('usuarios')
    .select('id, telefone_whatsapp')
    .eq('corretora_id', usuario.corretora_id)
    .eq('adm', 'S')
    .single()

  return {
    telefone: admin?.telefone_whatsapp ?? null,
    adminId: admin?.id ?? null,
    corretoraId: usuario.corretora_id,
  }
}
