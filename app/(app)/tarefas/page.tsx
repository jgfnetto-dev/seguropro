export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { TarefaButton } from './tarefa-button'
import { DeleteTarefaButton } from './delete-button'
import type { Tarefa } from '@/types'

export default async function TarefasPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase.from('usuarios').select('id').eq('id', session.user.id).single()

  const { data: tarefas } = await supabase
    .from('tarefas')
    .select('*')
    .eq('usuario_id', usuario?.id)
    .order('data', { ascending: true })
    .order('hora', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-on-surface">Tarefas e Agendamentos</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Organize seus compromissos e receba um lembrete via WhatsApp na data e hora agendadas.
          </p>
        </div>
        <TarefaButton />
      </div>

      <Card>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Data</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Hora</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Tarefa</th>
              <th className="label-caps text-on-surface-variant text-left px-4 py-3">Lembrete</th>
              <th className="label-caps text-on-surface-variant text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(tarefas as Tarefa[] | null)?.map((t, i) => (
              <tr key={t.id} className={`border-b border-outline-variant/20 hover:bg-surface-container-low ${i % 2 === 0 ? '' : 'bg-surface-container-low/40'}`}>
                <td className="px-4 py-3 text-body-sm text-on-surface">{formatDate(t.data)}</td>
                <td className="px-4 py-3 text-body-sm text-on-surface">{t.hora.slice(0, 5)}</td>
                <td className="px-4 py-3 text-body-sm text-on-surface-variant">{t.tarefa}</td>
                <td className="px-4 py-3">
                  {t.whatsapp_enviado ? (
                    <Badge variant="success" className="text-xs">Enviado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Pendente</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <TarefaButton tarefa={t} />
                    <DeleteTarefaButton id={t.id} tarefa={t.tarefa} />
                  </div>
                </td>
              </tr>
            ))}
            {!tarefas?.length && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-body-sm text-on-surface-variant">
                  Nenhuma tarefa agendada
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {tarefas && tarefas.length > 0 && (
          <div className="px-4 py-3 border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
            Exibindo {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </div>
  )
}
