'use client'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn, NOMES_MESES_ABREV } from '@/lib/utils'
import { TarefaButton } from './tarefa-button'
import type { Tarefa } from '@/types'

const MAX_VISIVEL = 2

interface Props {
  dia: number
  mesAbrev: number
  dataKey: string
  noMesAtual: boolean
  hoje: boolean
  tarefas: Tarefa[]
}

function Chip({ tarefa }: { tarefa: Tarefa }) {
  return (
    <TarefaButton
      tarefa={tarefa}
      trigger={
        <button
          title={tarefa.tarefa}
          className={cn(
            'w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded truncate shrink-0',
            tarefa.whatsapp_enviado
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          )}
        >
          {tarefa.hora.slice(0, 5)} {tarefa.tarefa}
        </button>
      }
    />
  )
}

export function TarefaDiaCell({ dia, mesAbrev, dataKey, noMesAtual, hoje, tarefas }: Props) {
  const [expandido, setExpandido] = useState(false)
  const visiveis = tarefas.slice(0, MAX_VISIVEL)
  const restantes = tarefas.length - visiveis.length

  return (
    <div
      className={cn(
        'relative border border-outline-variant/20 p-1.5 h-full flex flex-col gap-1 overflow-hidden',
        !noMesAtual && 'bg-surface-container-low/40'
      )}
    >
      <div className="flex items-center justify-between shrink-0">
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

      <div className="flex flex-col gap-1 min-h-0 flex-1">
        {visiveis.map((t) => <Chip key={t.id} tarefa={t} />)}
        {restantes > 0 && (
          <button
            onClick={() => setExpandido(true)}
            className="w-full text-left text-[11px] font-medium text-on-surface-variant hover:text-on-surface px-1.5 shrink-0"
          >
            +{restantes} mais
          </button>
        )}
      </div>

      {expandido && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setExpandido(false)} />
          <div className="absolute top-0 left-0 right-0 z-50 bg-card border border-primary rounded shadow-overlay p-1.5 flex flex-col gap-1 max-h-[280px]">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-on-surface">
                {noMesAtual ? dia : `${dia} de ${NOMES_MESES_ABREV[mesAbrev]}`}
              </span>
              <div className="flex items-center gap-1">
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
                <button
                  onClick={() => setExpandido(false)}
                  title="Fechar"
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto">
              {tarefas.map((t) => <Chip key={t.id} tarefa={t} />)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
