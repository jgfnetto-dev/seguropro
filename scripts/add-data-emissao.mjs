import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
ALTER TABLE apolices ADD COLUMN IF NOT EXISTS data_emissao date;
UPDATE apolices SET data_emissao = data_inicio WHERE data_emissao IS NULL;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Coluna data_emissao criada na tabela apolices e preenchida para registros existentes.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
