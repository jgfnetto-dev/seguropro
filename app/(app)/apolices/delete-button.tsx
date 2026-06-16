'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Props {
  id: string
  numeroApolice: string
  clienteNome: string
  isUltimaApoliceDoCliente: boolean
}

export function DeleteApoliceButton({ id, numeroApolice, clienteNome, isUltimaApoliceDoCliente }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const mensagemConfirmacao = isUltimaApoliceDoCliente
      ? `Esta é a única apólice de ${clienteNome}. Ao excluir a apólice nº ${numeroApolice}, o cliente também será excluído. Confirmar?`
      : `Excluir a apólice nº ${numeroApolice} de ${clienteNome}?`

    if (!confirm(mensagemConfirmacao)) return

    setLoading(true)
    const res = await fetch(`/api/apolices?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      showToast(`Erro ao excluir: ${data.error ?? 'falha desconhecida'}`, 'error')
      return
    }

    if (data.clienteExcluido) {
      showToast(`Apólice nº ${numeroApolice} e o cliente ${clienteNome} foram excluídos.`, 'success')
    } else {
      showToast(`Apólice nº ${numeroApolice} excluída.`, 'success')
    }
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
