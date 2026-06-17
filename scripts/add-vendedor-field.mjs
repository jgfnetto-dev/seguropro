import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `ALTER TABLE apolices ADD COLUMN IF NOT EXISTS vendedor text;`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Coluna vendedor criada na tabela apolices.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
