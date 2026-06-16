import pg from 'pg'

const poolerUrl = process.argv[2]
const email = process.argv[3]
const nomeUsuario = process.argv[4]
const nomeCorretora = process.argv[5]

if (!poolerUrl || !email || !nomeUsuario || !nomeCorretora) {
  console.error('Uso: node create-first-user.mjs <poolerUrl> <email> <nomeUsuario> <nomeCorretora>')
  process.exit(1)
}

const { Client } = pg

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()

  const { rows: userRows } = await client.query(
    'SELECT id FROM auth.users WHERE email = $1 LIMIT 1',
    [email]
  )

  if (!userRows.length) {
    console.error(`Nenhum usuário encontrado no Auth com o e-mail ${email}. Crie-o primeiro em Authentication > Users.`)
    await client.end()
    process.exit(1)
  }

  const authUserId = userRows[0].id
  console.log(`Usuário Auth encontrado: ${authUserId}`)

  const { rows: existing } = await client.query(
    'SELECT id FROM usuarios WHERE id = $1',
    [authUserId]
  )

  if (existing.length) {
    console.log('Usuário já vinculado a uma corretora. Nada a fazer.')
    await client.end()
    return
  }

  const { rows: corretoraRows } = await client.query(
    'INSERT INTO corretoras (nome) VALUES ($1) RETURNING id',
    [nomeCorretora]
  )
  const corretoraId = corretoraRows[0].id
  console.log(`Corretora criada: ${corretoraId}`)

  await client.query(
    "INSERT INTO usuarios (id, corretora_id, email, nome, adm) VALUES ($1, $2, $3, $4, 'S')",
    [authUserId, corretoraId, email, nomeUsuario]
  )
  console.log('✓ Usuário vinculado com sucesso.')

  await client.end()
}

main().catch((err) => {
  console.error('Falha:', err.message)
  process.exit(1)
})
