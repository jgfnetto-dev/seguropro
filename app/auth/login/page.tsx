'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-on-primary" />
          </div>
          <h1 className="text-h2 text-on-surface">SeguroPro</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Gestão inteligente para corretores de elite</p>
        </div>

        <div className="bg-card rounded-lg shadow-card border border-outline-variant/30 p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="label-caps text-on-surface-variant block mb-1">E-mail profissional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <Input
                  type="email"
                  placeholder="exemplo@seguropro.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-caps text-on-surface-variant block mb-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-outline-variant"
                />
                Lembrar acesso
              </label>
              <button type="button" className="text-body-sm text-secondary hover:underline">
                Esqueci minha senha
              </button>
            </div>

            {error && (
              <div className="rounded bg-error/10 border border-error/20 px-3 py-2 text-body-sm text-error">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar →'}
            </Button>
          </form>

          <p className="text-center text-body-sm text-on-surface-variant mt-4">
            Ainda não tem uma conta?{' '}
            <span className="text-secondary hover:underline cursor-pointer">Solicitar demonstração</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Shield className="w-3 h-3" />
            Segurança bancária
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Shield className="w-3 h-3" />
            LGPD Compliance
          </div>
        </div>
        <p className="text-center text-xs text-on-surface-variant mt-3">
          © 2024 SeguroPro Tecnologia. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
