import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id, adm')
    .eq('id', session.user.id)
    .single()

  if (usuario?.adm !== 'S') return NextResponse.json({ error: 'Apenas administradores podem excluir.' }, { status: 403 })

  const { error } = await supabase
    .from('assistente_docs')
    .delete()
    .eq('id', params.id)
    .eq('corretora_id', usuario.corretora_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
