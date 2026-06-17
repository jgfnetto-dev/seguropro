'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HandCoins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

interface Props {
  apoliceId: string
  numeroApolice: string
  clienteNome: string
  comissaoDisponivel: number
}

export function ConciliarButton({ apoliceId, numeroApolice, clienteNome, comissaoDisponivel }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [dataConciliacao, setDataConciliacao] = useState(new Date().toISOString().split('T')[0])
  const [valorConciliar, setValorConciliar] = useState('')
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valor = parseFloat(valorConciliar)
    if (!valorConciliar || Number.isNaN(valor) || valor <= 0) {
      showToast('Informe um valor a conciliar válido.', 'error')
      return
    }
    setLoading(true)
    const res = await fetch('/api/conciliacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apolice_id: apoliceId,
        numero_apolice: numeroApolice,
        data_conciliacao: dataConciliacao,
        valor_conciliar: valor,
        comentario,
      }),
    })
    const result = await res.json()
    setLoading(false)
    if (res.ok) {
      showToast('Conciliação registrada com sucesso!', 'success')
      setValorConciliar('')
      setComentario('')
      setOpen(false)
      router.refresh()
    } else {
      showToast(`Erro ao registrar conciliação: ${result.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            title="Conciliar"
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
          >
            <HandCoins className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conciliar Comissão</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Apólice</Label>
              <div className="h-10 flex items-center px-3 rounded border border-outline-variant bg-surface-container-low text-body-sm text-on-surface">
                Nº {numeroApolice} — {clienteNome}
              </div>
            </div>

            <div>
              <Label>Comissão Disponível</Label>
              <div className="h-10 flex items-center px-3 rounded border border-outline-variant bg-surface-container-low text-body-sm text-on-surface">
                {formatCurrency(comissaoDisponivel)}
              </div>
            </div>

            <div>
              <Label htmlFor="data-conciliacao">Data de Conciliação</Label>
              <Input id="data-conciliacao" type="date" value={dataConciliacao} onChange={(e) => setDataConciliacao(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="valor-conciliar">Valor a Conciliar</Label>
              <Input
                id="valor-conciliar"
                type="number"
                step="0.01"
                min="0"
                value={valorConciliar}
                onChange={(e) => setValorConciliar(e.target.value)}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div>
              <Label htmlFor="comentario-conciliacao">Comentário</Label>
              <Textarea
                id="comentario-conciliacao"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Observação opcional sobre esta conciliação..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Conciliar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
