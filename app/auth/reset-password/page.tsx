'use client'
export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Lock, Eye, EyeOff } from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast, ToastComponent } = useToast()
  const [verificando, setVerificando] = useState(true)
  const [linkValido, setLinkValido] = useState(false)
  const [motivoInvalido, setMotivoInvalido] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function validarLink() {
      const supabase = getSupabaseBrowser()

      const erroDescricao = searchParams?.get('error_description')
      if (erroDescricao) {
        setMotivoInvalido(decodeURIComponent(erroDescricao))
        setVerificando(false)
        return
      }

      const code = searchParams?.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) setMotivoInvalido(error.message)
        setLinkValido(!error)
        setVerificando(false)
        return
      }

      // Formato legado (implicit flow): tokens vêm no hash da URL, não na query string.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error) setMotivoInvalido(error.message)
        setLinkValido(!error)
        setVerificando(false)
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      setLinkValido(!!session)
      setVerificando(false)
    }
    validarLink()
  }, [searchParams])

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
    const { error } = await supabase.auth.updateUser({ password: senha })
    setLoading(false)

    if (error) {
      showToast(`Erro ao redefinir senha: ${error.message}`, 'error')
      return
    }

    showToast('Senha redefinida com sucesso! Faça login novamente.', 'success')
    await supabase.auth.signOut()
    setTimeout(() => router.push('/auth/login'), 1500)
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
          <p className="text-body-sm text-on-surface-variant mt-1">Redefinir senha</p>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-outline-variant/30 p-6">
          {verificando ? (
            <p className="text-body-sm text-on-surface-variant text-center py-4">Verificando link...</p>
          ) : !linkValido ? (
            <div className="text-center space-y-3">
              <p className="text-body-sm text-error">
                Este link de recuperação é inválido ou expirou.
              </p>
              {motivoInvalido && (
                <p className="text-xs text-on-surface-variant">{motivoInvalido}</p>
              )}
              <a href="/auth/login" className="text-body-sm text-secondary hover:underline">
                Solicitar novo link
              </a>
            </div>
          ) : (
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
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
