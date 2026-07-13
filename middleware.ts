import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Endpoints de cron e leads são chamados sem sessão de navegador.
  if (
    request.nextUrl.pathname.startsWith('/api/cron') ||
    request.nextUrl.pathname.startsWith('/api/leads')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // /auth/reset-password nunca redireciona, mesmo com sessão ativa: o usuário pode
  // estar trocando a senha a partir do link de recuperação recebido por e-mail.
  if (pathname.startsWith('/auth/reset-password')) {
    return response
  }

  // Rotas sempre acessíveis, mesmo sem sessão
  const publicPaths = ['/auth/login', '/cotacao/']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Apenas rotas de autenticação redirecionam para o dashboard quando logado
  // (cotação deve ser acessível mesmo com sessão ativa)
  const authOnlyPaths = ['/auth/login']
  const isAuthOnly = authOnlyPaths.some((p) => pathname.startsWith(p))

  if (session && isAuthOnly) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Força a troca de senha no primeiro acesso: qualquer navegação de página (exceto
  // a própria tela de troca e as rotas de API) é redirecionada até a senha ser alterada.
  const forcaTrocaSenhaPath = '/auth/trocar-senha-obrigatoria'
  if (session && !pathname.startsWith('/api') && pathname !== forcaTrocaSenhaPath) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('senha_deve_ser_alterada')
      .eq('id', session.user.id)
      .single()
    if (usuario?.senha_deve_ser_alterada) {
      return NextResponse.redirect(new URL(forcaTrocaSenhaPath, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
