import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('corretora_id')
    .eq('id', session.user.id)
    .single()

  if (!usuario?.corretora_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('leads_auto')
    .delete()
    .eq('id', id)
    .eq('corretora_id', usuario.corretora_id)

  if (error) return NextResponse.json({ error: 'Erro ao excluir lead.' }, { status: 500 })

  return NextResponse.json({ success: true })
}
