'use client'
import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface Props {
  apoliceId: string
  numeroApolice: string
  clienteNome: string
  telefoneCliente?: string | null
  temEmail: boolean
  temPdf: boolean
}

export function EnviarApoliceButton({ apoliceId, numeroApolice, clienteNome, telefoneCliente, temEmail, temPdf }: Props) {
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [telefone, setTelefone] = useState(telefoneCliente ?? '')
  const [loading, setLoading] = useState(false)

  async function handleEnviar() {
    if (!telefone.trim()) {
      showToast('Informe o WhatsApp do cliente.', 'error')
      return
    }
    setLoading(true)
    const res = await fetch('/api/apolices/enviar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apolice_id: apoliceId, telefone: telefone.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      showToast(
        data.emailEnviado ? 'Apólice enviada por WhatsApp e e-mail!' : 'Apólice enviada por WhatsApp! Cliente sem e-mail cadastrado.',
        'success'
      )
      setOpen(false)
    } else {
      showToast(`Erro ao enviar apólice: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            title="Enviar apólice ao cliente"
            disabled={!temPdf}
            className="p-1.5 rounded border border-outline-variant bg-card hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Apólice ao Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-body-sm text-on-surface">
              Apólice Nº {numeroApolice} — {clienteNome}
            </p>
            <div>
              <Label>WhatsApp do Cliente</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (11) 91234-5678"
              />
            </div>
            <p className="text-body-sm text-on-surface-variant">
              O PDF da apólice será enviado via WhatsApp com uma mensagem de agradecimento.
              {temEmail ? ' O cliente também receberá uma cópia por e-mail.' : ' O cliente não possui e-mail cadastrado, então o envio será apenas por WhatsApp.'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={handleEnviar} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
