'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

const STATUS_OPCOES = ['Proposta', 'Renovada', 'Cancelada']

interface Props {
  apoliceId: string
  numeroApolice: string
  clienteNome: string
}

export function CadastrarStatusButton({ apoliceId, numeroApolice, clienteNome }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('')
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!status) { showToast('Selecione o status.', 'error'); return }
    setLoading(true)
    const res = await fetch('/api/status-renovacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apolice_id: apoliceId, numero_apolice: numeroApolice, data, status, observacao }),
    })
    const result = await res.json()
    setLoading(false)
    if (res.ok) {
      showToast('Status registrado com sucesso!', 'success')
      setStatus('')
      setObservacao('')
      setOpen(false)
      router.refresh()
    } else {
      showToast(`Erro ao registrar status: ${result.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            title="Cadastrar Status"
            className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
          >
            <ClipboardCheck className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Status de Renovação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Apólice a Renovar</Label>
              <div className="h-10 flex items-center px-3 rounded border border-outline-variant bg-surface-container-low text-body-sm text-on-surface">
                Nº {numeroApolice} — {clienteNome}
              </div>
            </div>

            <div>
              <Label htmlFor="data-status">Data</Label>
              <Input id="data-status" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPCOES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacao-status">Observação</Label>
              <Textarea
                id="observacao-status"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Breve relato sobre o andamento da renovação..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Status'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
