export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { NOMES_MESES, NOMES_DIAS_SEMANA, getMonthGrid, toDateKey } from '@/lib/utils'
import { TarefaButton } from './tarefa-button'
import { TarefaDiaCell } from './tarefa-dia-cell'
import { ExcluirEnviadasButton } from './excluir-enviadas-button'
import type { Tarefa } from '@/types'

export default async function TarefasPage({ searchParams }: { searchParams: { mes?: string; ano?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: usuario } = await supabase.from('usuarios').select('id').eq('id', session.user.id).single()

  const hoje = new Date()
  const mes = searchParams.mes ? parseInt(searchParams.mes) : hoje.getMonth()
  const ano = searchParams.ano ? parseInt(searchParams.ano) : hoje.getFullYear()
  const hojeKey = toDateKey(hoje)

  const semanas = getMonthGrid(ano, mes)
  const inicioGrade = toDateKey(semanas[0][0])
  const fimGrade = toDateKey(semanas[semanas.length - 1][6])

  const { data: tarefas } = await supabase
    .from('tarefas')
    .select('*')
    .eq('usuario_id', usuario?.id)
    .gte('data', inicioGrade)
    .lte('data', fimGrade)
    .order('hora', { ascending: true })

  const tarefasPorDia = new Map<string, Tarefa[]>()
  ;(tarefas as Tarefa[] | null)?.forEach((t) => {
    const lista = tarefasPorDia.get(t.data) ?? []
    lista.push(t)
    tarefasPorDia.set(t.data, lista)
  })

  const totalEnviadas = (tarefas as Tarefa[] | null)?.filter((t) => t.whatsapp_enviado).length ?? 0

  const prevMes = mes === 0 ? 11 : mes - 1
  const prevAno = mes === 0 ? ano - 1 : ano
  const nextMes = mes === 11 ? 0 : mes + 1
  const nextAno = mes === 11 ? ano + 1 : ano

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-h1 text-on-surface">Tarefas e Agendamentos</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Organize seus compromissos e receba um lembrete via WhatsApp na data e hora agendadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExcluirEnviadasButton quantidade={totalEnviadas} />
          <TarefaButton />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/tarefas">
          <Button variant="outline" size="sm">Hoje</Button>
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/tarefas?mes=${prevMes}&ano=${prevAno}`}>
            <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Link>
          <h2 className="text-h3 text-on-surface w-44 text-center">{NOMES_MESES[mes]} {ano}</h2>
          <Link href={`/tarefas?mes=${nextMes}&ano=${nextAno}`}>
            <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface">
              <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
        <div className="w-20" />
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-outline-variant/30">
          {NOMES_DIAS_SEMANA.map((nome) => (
            <div key={nome} className="label-caps text-on-surface-variant text-left px-3 py-2">{nome}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {semanas.flatMap((semana) =>
            semana.map((data) => {
              const dataKey = toDateKey(data)
              return (
                <TarefaDiaCell
                  key={dataKey}
                  dia={data.getDate()}
                  mesAbrev={data.getMonth()}
                  dataKey={dataKey}
                  noMesAtual={data.getMonth() === mes}
                  hoje={dataKey === hojeKey}
                  tarefas={tarefasPorDia.get(dataKey) ?? []}
                />
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
