import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  const res = await client.query("SELECT codigo, nome, ramos FROM seguradoras WHERE nome ILIKE '%Tokio%'")
  console.log(JSON.stringify(res.rows, null, 2))
  await client.end()
}

main()
