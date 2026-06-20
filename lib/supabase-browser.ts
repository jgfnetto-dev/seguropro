'use client'
import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}

// @supabase/ssr força flowType "pkce", que exige que o link de recuperação seja aberto
// no MESMO navegador/perfil que solicitou o e-mail (o "code verifier" fica salvo lá).
// Para o link funcionar em qualquer navegador/dispositivo, usamos aqui o client "puro"
// do supabase-js com flowType "implicit" só para disparar o e-mail de recuperação —
// isso faz o link trazer o token diretamente, sem depender de nada salvo no navegador de origem.
export function getSupabaseImplicit() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit', persistSession: false } }
  )
}
