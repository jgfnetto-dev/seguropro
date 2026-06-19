'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Props {
  id: string
  tarefa: string
}

export function DeleteTarefaButton({ id, tarefa }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Excluir a tarefa "${tarefa}"?`)) return

    setLoading(true)
    const res = await fetch(`/api/tarefas?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      showToast(`Erro ao excluir: ${data.error ?? 'falha desconhecida'}`, 'error')
      return
    }

    showToast('Tarefa excluída.', 'success')
    router.refresh()
  }

  return (
    <>
      {ToastComponent}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  )
}
