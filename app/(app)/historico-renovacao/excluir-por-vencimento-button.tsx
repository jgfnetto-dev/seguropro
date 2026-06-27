'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface Props {
  meses: { value: string; label: string }[]
  anos: number[]
}

export function ExcluirPorVencimentoButton({ meses, anos }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [mes, setMes] = useState('')
  const [ano, setAno] = useState('')
  const [excluindo, setExcluindo] = useState(false)

  async function handleExcluir() {
    if (!mes || !ano) {
      showToast('Selecione o mês e o ano de vencimento.', 'error')
      return
    }
    if (!confirm(`Excluir todos os registros de histórico com vencimento em ${meses.find((m) => m.value === mes)?.label}/${ano}?`)) return

    setExcluindo(true)
    const res = await fetch(`/api/historico-renovacao?mes=${mes}&ano=${ano}`, { method: 'DELETE' })
    const data = await res.json()
    setExcluindo(false)

    if (!res.ok) {
      showToast(`Erro ao excluir registros: ${data.error ?? 'falha desconhecida'}`, 'error')
      return
    }
    showToast(`${data.excluidos} registro(s) excluído(s).`, 'success')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Trash2 className="w-4 h-4" /> Excluir por Vencimento
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Registros por Vencimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-body-sm text-on-surface-variant">
              Exclui em massa todos os registros do histórico cuja apólice venceu no mês/ano selecionado.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mês de Vencimento</Label>
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="h-10 w-full px-3 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione</option>
                  {meses.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Ano</Label>
                <select
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  className="h-10 w-full px-3 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione</option>
                  {anos.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <Button variant="destructive" onClick={handleExcluir} disabled={excluindo} className="gap-2 w-full">
              {excluindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Excluir Registros
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
