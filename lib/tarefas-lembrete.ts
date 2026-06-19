import { SupabaseClient } from '@supabase/supabase-js'
import { sendWhatsAppMessage } from '@/lib/evolution'
import { formatDate } from '@/lib/utils'

interface TarefaPendente {
  id: string
  data: string
  hora: string
  tarefa: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function enviarLembretesPendentes(supabase: SupabaseClient<any>, tarefas: TarefaPendente[], telefoneWhatsapp: string) {
  let enviadas = 0
  for (const tarefa of tarefas) {
    // Reivindica a tarefa de forma atômica (UPDATE condicional) para evitar envio duplicado
    // quando múltiplas verificações concorrentes encontram a mesma tarefa pendente.
    const { data: reivindicada } = await supabase
      .from('tarefas')
      .update({ whatsapp_enviado: true })
      .eq('id', tarefa.id)
      .eq('whatsapp_enviado', false)
      .select()
      .maybeSingle()

    if (!reivindicada) continue

    const texto = `📅 *Lembrete de Tarefa* — SeguroPro\n\n${tarefa.tarefa}\n\nAgendado para ${formatDate(tarefa.data)} às ${tarefa.hora.slice(0, 5)}.`
    try {
      await sendWhatsAppMessage(telefoneWhatsapp, texto)
      enviadas++
    } catch {
      // Falha no envio: libera a tarefa para nova tentativa na próxima verificação.
      await supabase.from('tarefas').update({ whatsapp_enviado: false }).eq('id', tarefa.id)
    }
  }
  return enviadas
}
