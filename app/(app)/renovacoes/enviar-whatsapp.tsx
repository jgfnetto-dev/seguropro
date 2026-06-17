'use client'
import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface ApoliceRenovacao {
  numero_apolice: string
  data_fim: string
  cliente?: { segurado: string }
  seguradora?: { nome: string }
}

interface Props {
  apolices: ApoliceRenovacao[]
  mesNome: string
}

export function EnviarWhatsappButton({ apolices, mesNome }: Props) {
  const [loading, setLoading] = useState(false)
  const { showToast, ToastComponent } = useToast()

  async function handleEnviar() {
    setLoading(true)

    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apolices, mesNome }),
    })

    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      showToast('PDF de renovações enviado via WhatsApp!', 'success')
    } else {
      showToast(`Erro ao enviar WhatsApp: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <button
        onClick={handleEnviar}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-600 text-white font-semibold shadow-overlay hover:bg-green-700 transition-colors disabled:opacity-60"
      >
        <MessageCircle className="w-5 h-5" />
        {loading ? 'Enviando...' : 'Enviar Renovações via WhatsApp'}
      </button>
    </>
  )
}
