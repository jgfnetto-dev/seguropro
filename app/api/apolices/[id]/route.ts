import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

  const { status_manual } = body
  const allowed = [null, 'cancelado']
  if (!allowed.includes(status_manual)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('apolices')
    .update({ status_manual })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
