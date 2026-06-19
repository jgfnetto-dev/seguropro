'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function TarefasChecker() {
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/tarefas/verificar-pendentes', { method: 'POST' }).catch(() => {})
  }, [pathname])

  return null
}
