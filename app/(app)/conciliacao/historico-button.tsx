'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatDate, formatCurrency } from '@/lib/utils'

interface RegistroConciliacao {
  data_conciliacao: string
  valor_conciliar: number
  comentario?: string | null
}

interface Props {
  numeroApolice: string
  historico: RegistroConciliacao[]
}

export function HistoricoConciliacaoButton({ numeroApolice, historico }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          title="Ver histórico de conciliações"
          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-sm font-semibold leading-none"
        >
          (...)
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de Conciliação — Nº {numeroApolice}</DialogTitle>
        </DialogHeader>
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/30">
              <th className="label-caps text-on-surface-variant text-left px-2 py-2">Data Conciliação</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-2">Valor Conciliado</th>
              <th className="label-caps text-on-surface-variant text-left px-2 py-2">Comentário</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((h, i) => (
              <tr key={i} className="border-b border-outline-variant/20">
                <td className="px-2 py-2 text-body-sm text-on-surface">{formatDate(h.data_conciliacao)}</td>
                <td className="px-2 py-2 text-body-sm text-on-surface">{formatCurrency(h.valor_conciliar)}</td>
                <td className="px-2 py-2 text-body-sm text-on-surface-variant">{h.comentario || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DialogContent>
    </Dialog>
  )
}
