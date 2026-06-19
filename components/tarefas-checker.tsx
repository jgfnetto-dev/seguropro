'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const INTERVALO_MS = 60_000

export function TarefasChecker() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    function verificar() {
      fetch('/api/tarefas/verificar-pendentes', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data?.sent > 0) router.refresh()
        })
        .catch(() => {})
    }

    verificar()
    const id = setInterval(verificar, INTERVALO_MS)
    return () => clearInterval(id)
  }, [pathname, router])

  return null
}
