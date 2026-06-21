'use client'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  const visiveis = tarefas.slice(0, MAX_VISIVEL)
  const restantes = tarefas.length - visiveis.length
  const labelDia = noMesAtual ? dia : `${dia} de ${NOMES_MESES_ABREV[mesAbrev]}`

  return (
    <div
      className={cn(
        'border border-outline-variant/20 p-1.5 h-full flex flex-col gap-1 overflow-hidden',
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
          {labelDia}
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
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full text-left text-[11px] font-medium text-on-surface-variant hover:text-on-surface px-1.5 shrink-0">
                +{restantes} mais
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tarefas do dia {labelDia}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto">
                {tarefas.map((t) => <Chip key={t.id} tarefa={t} />)}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
