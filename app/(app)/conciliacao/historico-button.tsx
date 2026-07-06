'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatCurrency } from '@/lib/utils'

interface RegistroConciliacao {
  id: string
  data_conciliacao: string
  valor_conciliar: number
  comentario?: string | null
}

interface Props {
  numeroApolice: string
  historico: RegistroConciliacao[]
}

export function HistoricoConciliacaoButton({ numeroApolice, historico }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ data_conciliacao: string; valor_conciliar: string; comentario: string }>({ data_conciliacao: '', valor_conciliar: '', comentario: '' })
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  function startEdit(h: RegistroConciliacao) {
    setEditingId(h.id)
    setEditData({
      data_conciliacao: h.data_conciliacao,
      valor_conciliar: h.valor_conciliar.toString(),
      comentario: h.comentario ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSave(id: string) {
    const valor = parseFloat(editData.valor_conciliar)
    if (Number.isNaN(valor) || valor <= 0) {
      showToast('Informe um valor válido.', 'error')
      return
    }
    setSaving(true)
    const res = await fetch('/api/conciliacao', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        data_conciliacao: editData.data_conciliacao,
        valor_conciliar: valor,
        comentario: editData.comentario || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      showToast('Conciliação atualizada!', 'success')
      setEditingId(null)
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      showToast(`Erro: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este registro de conciliação?')) return
    const res = await fetch(`/api/conciliacao?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Registro excluído.', 'success')
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      showToast(`Erro: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            title="Ver histórico de conciliações"
            className="px-2 py-1 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-sm font-semibold leading-none"
          >
            (...)
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Conciliação — Nº {numeroApolice}</DialogTitle>
          </DialogHeader>
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="label-caps text-on-surface-variant text-left px-2 py-2">Data</th>
                <th className="label-caps text-on-surface-variant text-left px-2 py-2">Valor</th>
                <th className="label-caps text-on-surface-variant text-left px-2 py-2">Comentário</th>
                <th className="label-caps text-on-surface-variant text-right px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h) => (
                <tr key={h.id} className="border-b border-outline-variant/20">
                  {editingId === h.id ? (
                    <>
                      <td className="px-2 py-2">
                        <Input
                          type="date"
                          value={editData.data_conciliacao}
                          onChange={(e) => setEditData(d => ({ ...d, data_conciliacao: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editData.valor_conciliar}
                          onChange={(e) => setEditData(d => ({ ...d, valor_conciliar: e.target.value }))}
                          className="h-8 text-sm w-28"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Textarea
                          value={editData.comentario}
                          onChange={(e) => setEditData(d => ({ ...d, comentario: e.target.value }))}
                          className="text-sm min-h-[2rem] h-8 py-1 resize-none"
                          rows={1}
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" onClick={() => handleSave(h.id)} disabled={saving} className="h-7 px-2">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 px-2">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-2 text-body-sm text-on-surface">{formatDate(h.data_conciliacao)}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface">{formatCurrency(h.valor_conciliar)}</td>
                      <td className="px-2 py-2 text-body-sm text-on-surface-variant">{h.comentario || '—'}</td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(h)}
                            title="Editar"
                            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(h.id)}
                            title="Excluir"
                            className="p-1 rounded hover:bg-error/10 text-on-surface-variant hover:text-error"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </>
  )
}
