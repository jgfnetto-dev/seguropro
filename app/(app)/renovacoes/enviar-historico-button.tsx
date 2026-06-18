'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface Props {
  apoliceId: string
  numeroApolice: string
  clienteNome: string
  status: 'Renovada' | 'Cancelada'
}

export function EnviarHistoricoButton({ apoliceId, numeroApolice, clienteNome, status }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    const res = await fetch('/api/historico-renovacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apolice_id: apoliceId }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      showToast('Apólice enviada para o histórico com sucesso!', 'success')
      setOpen(false)
      router.refresh()
    } else {
      showToast(`Erro ao enviar para o histórico: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            title="Enviar para o histórico"
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
          >
            <Archive className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Apólice para o Histórico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-body-sm text-on-surface">
              A apólice Nº {numeroApolice} — {clienteNome} está com status <strong>{status}</strong>.
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Ao confirmar, os dados desta apólice (incluindo conciliações, endossos e status de renovação) serão movidos
              para o Histórico de Renovações e removidos da listagem ativa. O cliente só será removido se esta for sua
              última apólice.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Enviando...' : 'Confirmar e Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
