import pg from 'pg'

const poolerUrl = process.argv[2]
const id = process.argv[3]

const { Client } = pg

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  const res = await client.query('DELETE FROM apolices WHERE id = $1', [id])
  console.log('Deletado:', res.rowCount)
  await client.end()
}

main()
