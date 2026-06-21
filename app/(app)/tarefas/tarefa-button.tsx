'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import type { Tarefa } from '@/types'

interface Props {
  tarefa?: Tarefa
  dataPadrao?: string
  trigger?: React.ReactNode
}

export function TarefaButton({ tarefa, dataPadrao, trigger }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const isEdit = !!tarefa
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(tarefa?.data ?? dataPadrao ?? new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState(tarefa?.hora?.slice(0, 5) ?? '')
  const [texto, setTexto] = useState(tarefa?.tarefa ?? '')
  const [loading, setLoading] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data || !hora || !texto) {
      showToast('Informe data, hora e a tarefa.', 'error')
      return
    }
    setLoading(true)
    const method = isEdit ? 'PUT' : 'POST'
    const body = isEdit ? { id: tarefa.id, data, hora, tarefa: texto } : { data, hora, tarefa: texto }
    const res = await fetch('/api/tarefas', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await res.json()
    setLoading(false)
    if (res.ok) {
      showToast(isEdit ? 'Tarefa atualizada!' : 'Tarefa agendada com sucesso!', 'success')
      setOpen(false)
      if (!isEdit) { setTexto(''); setHora('') }
      router.refresh()
    } else {
      showToast(`Erro ao salvar tarefa: ${result.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  async function handleDelete() {
    if (!tarefa) return
    if (!confirm(`Excluir a tarefa "${tarefa.tarefa}"?`)) return

    setExcluindo(true)
    const res = await fetch(`/api/tarefas?id=${tarefa.id}`, { method: 'DELETE' })
    const result = await res.json()
    setExcluindo(false)

    if (!res.ok) {
      showToast(`Erro ao excluir: ${result.error ?? 'falha desconhecida'}`, 'error')
      return
    }
    showToast('Tarefa excluída.', 'success')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? (isEdit ? (
            <button
              title="Editar tarefa"
              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
            >
              <Pencil className="w-4 h-4" />
            </button>
          ) : (
            <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Tarefa</Button>
          ))}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Tarefa' : 'Nova Tarefa / Agendamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data-tarefa">Data</Label>
                <Input id="data-tarefa" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="hora-tarefa">Hora</Label>
                <Input id="hora-tarefa" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
              </div>
            </div>

            <div>
              <Label htmlFor="texto-tarefa">Tarefa</Label>
              <Textarea
                id="texto-tarefa"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Descreva o que precisa ser feito..."
                required
              />
            </div>

            <div className="flex justify-between items-center gap-3 pt-2">
              {isEdit ? (
                <Button type="button" variant="outline" className="gap-2 text-error hover:bg-error/10" onClick={handleDelete} disabled={excluindo}>
                  <Trash2 className="w-4 h-4" /> {excluindo ? 'Excluindo...' : 'Excluir'}
                </Button>
              ) : <span />}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Tarefa'}</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
