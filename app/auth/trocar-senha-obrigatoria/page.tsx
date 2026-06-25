'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Eye, EyeOff } from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

export default function TrocarSenhaObrigatoriaPage() {
  const router = useRouter()
  const { showToast, ToastComponent } = useToast()
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) {
      showToast('A senha deve ter ao menos 6 caracteres.', 'error')
      return
    }
    if (senha !== confirmarSenha) {
      showToast('As senhas não coincidem.', 'error')
      return
    }

    setLoading(true)
    const supabase = getSupabaseBrowser()
    const { data: userData, error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setLoading(false)
      showToast(`Erro ao definir senha: ${error.message}`, 'error')
      return
    }

    const userId = userData.user?.id
    if (userId) {
      await supabase.from('usuarios').update({ senha_deve_ser_alterada: false }).eq('id', userId)
    }

    setLoading(false)
    showToast('Senha definida com sucesso!', 'success')
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 1000)
  }

  async function handleSair() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center px-4">
      {ToastComponent}
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-on-primary" />
          </div>
          <h1 className="text-h2 text-on-surface">SeguroPro</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Defina sua nova senha</p>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-outline-variant/30 p-6">
          <p className="text-body-sm text-on-surface-variant mb-4">
            Este é seu primeiro acesso. Por segurança, defina uma nova senha antes de continuar.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label-caps text-on-surface-variant block mb-1">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label-caps text-on-surface-variant block mb-1">Confirmar nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Salvando...' : 'Definir senha e continuar'}
            </Button>
            <button
              type="button"
              onClick={handleSair}
              className="text-body-sm text-on-surface-variant hover:underline text-center"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
