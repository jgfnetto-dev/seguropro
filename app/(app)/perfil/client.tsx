'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, LogOut, User, Smartphone, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { getInitials } from '@/lib/utils'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import type { Usuario } from '@/types'

interface Props {
  usuario: Usuario | null
  stats: { totalApolices: number; renovacoesMes: number; clientesNovos: number }
}

type WaStatus = 'idle' | 'loading' | 'connected' | 'qr' | 'disconnected' | 'none' | 'error'

function WhatsAppConnectCard() {
  const [status, setStatus] = useState<WaStatus>('idle')
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  async function checkStatus() {
    try {
      const res = await fetch('/api/whatsapp/conectar')
      const data = await res.json()
      if (data.status === 'connected') {
        setStatus('connected')
        setQrcode(null)
        stopPoll()
      } else if (data.status === 'qr' && data.qrcode) {
        setStatus('qr')
        setQrcode(data.qrcode)
      } else {
        setStatus('none')
      }
    } catch {
      // silently keep current status on poll failure
    }
  }

  useEffect(() => {
    checkStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status === 'qr') {
      stopPoll()
      pollRef.current = setInterval(checkStatus, 5000)
    } else {
      stopPoll()
    }
    return stopPoll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  async function handleConnect(reconectar = false) {
    setStatus('loading')
    setQrcode(null)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/whatsapp/conectar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: reconectar ? 'reconectar' : 'conectar' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao conectar WhatsApp.')
        setStatus('error')
        return
      }
      if (data.status === 'qr' && data.qrcode) {
        setStatus('qr')
        setQrcode(data.qrcode)
      } else if (data.status === 'connected') {
        setStatus('connected')
      } else {
        setErrorMsg('QR code não retornado. Verifique o servidor Evolution API.')
        setStatus('error')
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro de rede ao conectar.')
      setStatus('error')
    }
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-on-surface-variant text-body-sm py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{status === 'loading' ? 'Conectando…' : 'Verificando conexão WhatsApp…'}</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-body-sm text-error">
          {errorMsg}
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={() => handleConnect(false)}>
          <Smartphone className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-body-sm text-green-700 font-medium">WhatsApp conectado</span>
        </div>
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => handleConnect(true)}>
          <Smartphone className="w-4 h-4 mr-2" />
          Reconectar com meu número
        </Button>
        <p className="text-xs text-on-surface-variant">
          Clique acima para conectar seu número pessoal. Isso desconectará o número atual.
        </p>
      </div>
    )
  }

  if (status === 'qr' && qrcode) {
    const src = qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
          <Smartphone className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <span className="text-body-sm text-yellow-700 font-medium">Escaneie o QR code com seu WhatsApp</span>
        </div>
        <div className="flex justify-center">
          <img src={src} alt="QR Code WhatsApp" className="w-48 h-48 rounded-lg border border-outline-variant/30" />
        </div>
        <p className="text-xs text-on-surface-variant text-center">
          Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
        </p>
        <Button variant="outline" size="sm" className="w-full" onClick={() => handleConnect(false)}>
          Gerar novo QR code
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2">
        <XCircle className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
        <span className="text-body-sm text-on-surface-variant">WhatsApp não conectado</span>
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={() => handleConnect(false)}>
        <Smartphone className="w-4 h-4 mr-2" />
        Conectar WhatsApp
      </Button>
      <p className="text-xs text-on-surface-variant">
        Conecte seu número para que os envios partam do seu WhatsApp.
      </p>
    </div>
  )
}

export function PerfilClient({ usuario, stats }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const isAdmin = usuario?.adm === 'S'
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [telefone, setTelefone] = useState(usuario?.telefone_whatsapp ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, telefone_whatsapp: telefone }),
    })
    setLoading(false)
    if (res.ok) showToast('Alterações salvas!', 'success')
    else showToast('Erro ao salvar.', 'error')
  }

  async function handleLogout() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const initials = getInitials(usuario?.nome ?? 'U')

  return (
    <>
      {ToastComponent}
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary text-2xl font-bold">
              {initials}
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-xs">✏</button>
          </div>
          <h2 className="text-h2 text-on-surface">{usuario?.nome}</h2>
          <p className="text-body-sm text-on-surface-variant">Corretor • {usuario?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-secondary" />
                <h3 className="text-h3 text-on-surface">Informações Pessoais</h3>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div>
                  <Label>E-mail Profissional</Label>
                  <Input value={usuario?.email ?? ''} disabled className="opacity-60" />
                </div>
                <div>
                  <Label>WhatsApp / Telefone</Label>
                  <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Conexão WhatsApp para envios</Label>
                    <WhatsAppConnectCard />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Salvando...' : '💾 Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-secondary" />
                  <h3 className="text-h3 text-on-surface">Segurança</h3>
                </div>
                <button className="w-full flex items-center justify-between p-3 rounded border border-outline-variant/30 hover:bg-surface-container text-body-sm text-on-surface">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-on-surface-variant" />
                    Alterar Senha
                  </div>
                  <span>›</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded border border-outline-variant/30 hover:bg-surface-container text-body-sm text-on-surface">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-on-surface-variant" />
                    Autenticação 2FA
                  </div>
                  <span>›</span>
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-3 rounded border border-error/30 text-body-sm text-error hover:bg-error/5"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Apólices Ativas', value: stats.totalApolices },
            { label: 'Renovações Este Mês', value: stats.renovacoesMes },
            { label: 'Clientes Novos', value: stats.clientesNovos },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <p className="label-caps text-on-surface-variant">{label}</p>
                <p className="text-2xl font-bold text-on-surface mt-1">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
