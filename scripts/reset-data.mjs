import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query('TRUNCATE TABLE apolices, clientes, seguradoras, usuarios, corretoras CASCADE')
  console.log('✓ Todas as tabelas de negócio foram limpas (corretoras, usuarios, seguradoras, clientes, apolices).')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
