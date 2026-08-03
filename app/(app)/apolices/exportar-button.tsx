'use client'

import { useState } from 'react'
import { Printer, Loader2, CheckCircle, AlertCircle, Smartphone, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  filtros: { q?: string; mes?: string; ano?: string; sort?: string; dir?: string }
}

function celularMask(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function ExportarApolicesButton({ filtros }: Props) {
  const [open, setOpen] = useState(false)
  const [via, setVia] = useState<'whatsapp' | 'email'>('whatsapp')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  function handleClose() {
    setOpen(false)
    setResult(null)
    setDestination('')
    setVia('whatsapp')
  }

  async function handleSend() {
    if (!destination.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/apolices/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: destination.trim(), via, ...filtros }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar.')
      setResult({ ok: true, msg: `PDF enviado com sucesso! (${data.total} apólice${data.total !== 1 ? 's' : ''})` })
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Erro ao enviar.' })
    } finally {
      setLoading(false)
    }
  }

  const temFiltro = filtros.q || filtros.mes || filtros.ano

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <button
          title="Exportar apólices como PDF"
          className="flex items-center justify-center w-9 h-9 rounded border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <Printer className="w-4 h-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Apólices como PDF</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${result.ok ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
              {result.ok
                ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              }
              {result.msg}
            </div>
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {temFiltro && (
              <div className="bg-surface-container rounded-lg px-3 py-2 text-body-sm text-on-surface-variant">
                O PDF respeitará o filtro aplicado na tela.
              </div>
            )}

            {/* Via */}
            <div className="space-y-2">
              <p className="text-body-sm font-medium text-on-surface">Enviar por</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setVia('whatsapp'); setDestination('') }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-body-sm font-medium transition-colors ${
                    via === 'whatsapp'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> WhatsApp
                </button>
                <button
                  onClick={() => { setVia('email'); setDestination('') }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-body-sm font-medium transition-colors ${
                    via === 'email'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  <Mail className="w-4 h-4" /> E-mail
                </button>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="label-caps text-on-surface-variant block">
                {via === 'whatsapp' ? 'Número do WhatsApp' : 'Endereço de e-mail'}
              </label>
              {via === 'whatsapp' ? (
                <input
                  className="w-full h-10 px-3 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="(21) 99999-9999"
                  value={destination}
                  onChange={(e) => setDestination(celularMask(e.target.value))}
                  inputMode="numeric"
                />
              ) : (
                <input
                  type="email"
                  className="w-full h-10 px-3 rounded border border-outline-variant bg-card text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="destinatario@email.com"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              )}
            </div>

            <Button
              onClick={handleSend}
              disabled={loading || !destination.trim()}
              className="w-full gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Gerando PDF…</>
              ) : (
                <><Printer className="w-4 h-4" />Gerar e Enviar PDF</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
