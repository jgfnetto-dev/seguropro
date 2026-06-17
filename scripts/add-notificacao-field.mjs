import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notificacao_renovacoes_enviada_em date;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Coluna notificacao_renovacoes_enviada_em criada.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
