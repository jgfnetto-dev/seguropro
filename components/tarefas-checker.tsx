'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function TarefasChecker() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/tarefas/verificar-pendentes', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.sent > 0) router.refresh()
      })
      .catch(() => {})
  }, [pathname, router])

  return null
}
