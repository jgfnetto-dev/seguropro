'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface Props {
  quantidade: number
}

export function ExcluirEnviadasButton({ quantidade }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)

  if (quantidade === 0) return null

  async function handleClick() {
    if (!confirm(`Excluir todas as ${quantidade} tarefas já enviadas?`)) return

    setLoading(true)
    const res = await fetch('/api/tarefas?enviadas=true', { method: 'DELETE' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      showToast(`Erro ao excluir: ${data.error ?? 'falha desconhecida'}`, 'error')
      return
    }

    showToast('Tarefas enviadas excluídas.', 'success')
    router.refresh()
  }

  return (
    <>
      {ToastComponent}
      <Button type="button" variant="outline" className="gap-2" onClick={handleClick} disabled={loading}>
        <Trash2 className="w-4 h-4" /> {loading ? 'Excluindo...' : `Excluir Enviadas (${quantidade})`}
      </Button>
    </>
  )
}
