'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const INTERVALO_PADRAO_MS = 60_000
const INTERVALO_TELA_TAREFAS_MS = 10_000

export function TarefasChecker() {
  const pathname = usePathname()
  const router = useRouter()
  const naTelaDeTarefas = pathname?.startsWith('/tarefas') ?? false

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
    const intervalo = naTelaDeTarefas ? INTERVALO_TELA_TAREFAS_MS : INTERVALO_PADRAO_MS
    const id = setInterval(verificar, intervalo)
    return () => clearInterval(id)
  }, [pathname, router, naTelaDeTarefas])

  return null
}
