'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, LogOut, User } from 'lucide-react'
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

export function PerfilClient({ usuario, stats }: Props) {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const isAdmin = usuario?.adm === 'S'
  const [nome, setNome] = useState(usuario?.nome ?? '')
  const [telefone, setTelefone] = useState(usuario?.telefone_whatsapp ?? '')
  const [whatsappInstance, setWhatsappInstance] = useState(usuario?.whatsapp_instance ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const body: Record<string, string> = { nome, telefone_whatsapp: telefone }
    if (isAdmin) body.whatsapp_instance = whatsappInstance
    const res = await fetch('/api/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
                  <div>
                    <Label>Instância WhatsApp (Evolution API)</Label>
                    <Input
                      value={whatsappInstance}
                      onChange={(e) => setWhatsappInstance(e.target.value)}
                      placeholder="nome-da-instancia"
                    />
                    <p className="text-xs text-on-surface-variant mt-1">
                      Nome da instância cadastrada no Evolution API para envios pelo seu número.
                    </p>
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
