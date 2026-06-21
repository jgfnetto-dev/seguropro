'use client'
import { Plus } from 'lucide-react'
import { cn, NOMES_MESES_ABREV } from '@/lib/utils'
import { TarefaButton } from './tarefa-button'
import type { Tarefa } from '@/types'

interface Props {
  dia: number
  mesAbrev: number
  dataKey: string
  noMesAtual: boolean
  hoje: boolean
  tarefas: Tarefa[]
}

export function TarefaDiaCell({ dia, mesAbrev, dataKey, noMesAtual, hoje, tarefas }: Props) {
  return (
    <div
      className={cn(
        'border border-outline-variant/20 p-1.5 min-h-[110px] flex flex-col gap-1',
        !noMesAtual && 'bg-surface-container-low/40'
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs font-medium',
            !noMesAtual && 'text-on-surface-variant',
            hoje && 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary font-semibold'
          )}
        >
          {noMesAtual ? dia : `${dia} de ${NOMES_MESES_ABREV[mesAbrev]}`}
        </span>
        <TarefaButton
          dataPadrao={dataKey}
          trigger={
            <button
              title="Nova tarefa neste dia"
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          }
        />
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto">
        {tarefas.map((t) => (
          <TarefaButton
            key={t.id}
            tarefa={t}
            trigger={
              <button
                title={t.tarefa}
                className={cn(
                  'w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded truncate',
                  t.whatsapp_enviado
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                )}
              >
                {t.hora.slice(0, 5)} {t.tarefa}
              </button>
            }
          />
        ))}
      </div>
    </div>
  )
}
