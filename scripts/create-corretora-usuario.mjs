import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envPath = new URL('../.env.local', import.meta.url)
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=')
      const key = l.slice(0, idx).trim()
      const value = l.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1')
      return [key, value]
    })
)

const nomeCorretora = process.argv[2]
const nomeUsuario = process.argv[3]
const email = process.argv[4]
const telefone = process.argv[5]
const senha = process.argv[6]

if (!nomeCorretora || !nomeUsuario || !email || !telefone || !senha) {
  console.error('Uso: node create-corretora-usuario.mjs <nomeCorretora> <nomeUsuario> <email> <telefone> <senha>')
  process.exit(1)
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const { data: corretora, error: corretoraError } = await supabase
    .from('corretoras')
    .insert({ nome: nomeCorretora })
    .select()
    .single()
  if (corretoraError) throw new Error(`Erro ao criar corretora: ${corretoraError.message}`)
  console.log(`✓ Corretora criada: ${corretora.id}`)

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (authError) throw new Error(`Erro ao criar usuário no Auth: ${authError.message}`)
  console.log(`✓ Usuário Auth criado: ${authUser.user.id}`)

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .insert({
      id: authUser.user.id,
      corretora_id: corretora.id,
      email,
      nome: nomeUsuario,
      telefone_whatsapp: telefone,
      adm: 'S',
      senha_deve_ser_alterada: true,
    })
    .select()
    .single()
  if (usuarioError) {
    await supabase.auth.admin.deleteUser(authUser.user.id)
    throw new Error(`Erro ao criar usuário: ${usuarioError.message}`)
  }
  console.log('✓ Usuário vinculado com sucesso.')
  console.log({ corretora_id: corretora.id, usuario_id: usuario.id, email, senha })
}

main().catch((err) => {
  console.error('Falha:', err.message)
  process.exit(1)
})
