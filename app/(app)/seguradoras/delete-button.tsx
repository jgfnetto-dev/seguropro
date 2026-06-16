'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeleteSeguradoraButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Excluir esta seguradora?')) return
    setLoading(true)
    await fetch(`/api/seguradoras?id=${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded hover:bg-error/10 text-on-surface-variant hover:text-error disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
