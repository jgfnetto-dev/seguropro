'use client'
import { useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { MESES, anosDisponiveis } from '@/lib/utils'

interface Props {
  mesAtual: number
  anoAtual: number
  emailUsuario?: string
}

export function RelatorioButton({ mesAtual, anoAtual, emailUsuario }: Props) {
  const { showToast, ToastComponent } = useToast()
  const [open, setOpen] = useState(false)
  const [mesInicio, setMesInicio] = useState(String(mesAtual))
  const [anoInicio, setAnoInicio] = useState(String(anoAtual))
  const [mesFim, setMesFim] = useState(String(mesAtual))
  const [anoFim, setAnoFim] = useState(String(anoAtual))
  const [canal, setCanal] = useState<'whatsapp' | 'email'>('whatsapp')
  const [email, setEmail] = useState(emailUsuario ?? '')
  const [enviando, setEnviando] = useState(false)

  async function handleEnviar() {
    if (canal === 'email' && !email.trim()) {
      showToast('Informe o e-mail de destino.', 'error')
      return
    }

    setEnviando(true)
    const res = await fetch('/api/renovacoes/relatorio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mesInicio: parseInt(mesInicio),
        anoInicio: parseInt(anoInicio),
        mesFim: parseInt(mesFim),
        anoFim: parseInt(anoFim),
        canal,
        email: canal === 'email' ? email.trim() : undefined,
      }),
    })
    const data = await res.json()
    setEnviando(false)

    if (res.ok) {
      showToast(
        canal === 'whatsapp' ? 'Relatório enviado via WhatsApp!' : `Relatório enviado para ${email}!`,
        'success'
      )
      setOpen(false)
    } else {
      showToast(`Erro ao enviar relatório: ${data.error ?? 'falha desconhecida'}`, 'error')
    }
  }

  return (
    <>
      {ToastComponent}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            title="Gerar relatório de renovações em PDF"
            className="p-2 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
          >
            <Printer className="w-4 h-4" />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relatório de Renovações (PDF)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Período</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="flex gap-2">
                  <Select value={mesInicio} onValueChange={setMesInicio}>
                    <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent>
                      {MESES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={anoInicio} onValueChange={setAnoInicio}>
                    <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                    <SelectContent>
                      {anosDisponiveis().map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Select value={mesFim} onValueChange={setMesFim}>
                    <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                    <SelectContent>
                      {MESES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={anoFim} onValueChange={setAnoFim}>
                    <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                    <SelectContent>
                      {anosDisponiveis().map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">De (mês/ano) até (mês/ano) — apólices com vencimento nesse intervalo.</p>
            </div>

            <div>
              <Label>Enviar por</Label>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant={canal === 'whatsapp' ? 'default' : 'outline'} className="flex-1" onClick={() => setCanal('whatsapp')}>
                  WhatsApp
                </Button>
                <Button type="button" variant={canal === 'email' ? 'default' : 'outline'} className="flex-1" onClick={() => setCanal('email')}>
                  E-mail
                </Button>
              </div>
            </div>

            {canal === 'email' && (
              <div>
                <Label htmlFor="email-relatorio">E-mail de destino</Label>
                <Input
                  id="email-relatorio"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.com"
                />
                <p className="text-xs text-on-surface-variant mt-1">Pode usar o e-mail cadastrado ou informar outro.</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="button" onClick={handleEnviar} disabled={enviando}>
                {enviando ? 'Enviando...' : 'Enviar Relatório'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
