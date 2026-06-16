'use client'
import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'

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
    const lista = apolices.map((a) =>
      `• ${a.cliente?.segurado} (${a.numero_apolice}) — Vence: ${formatDate(a.data_fim)} — ${a.seguradora?.nome}`
    ).join('\n')

    const texto = `🔄 *Renovações ${mesNome}* — SeguroPro\n\n${lista}\n\nTotal: ${apolices.length} apólice(s) para renovar.`

    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto }),
    })

    setLoading(false)
    if (res.ok) {
      showToast('Mensagem enviada via WhatsApp!', 'success')
    } else {
      showToast('Erro ao enviar WhatsApp. Verifique a configuração.', 'error')
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
