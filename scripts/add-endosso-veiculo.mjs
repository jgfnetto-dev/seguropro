import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
ALTER TABLE endossos ADD COLUMN IF NOT EXISTS veiculo text;
ALTER TABLE endossos ADD COLUMN IF NOT EXISTS ano text;
ALTER TABLE endossos ADD COLUMN IF NOT EXISTS modelo text;
ALTER TABLE endossos ADD COLUMN IF NOT EXISTS placa text;
ALTER TABLE endossos ADD COLUMN IF NOT EXISTS chassi text;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Colunas de veículo (veiculo, ano, modelo, placa, chassi) criadas na tabela endossos.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
