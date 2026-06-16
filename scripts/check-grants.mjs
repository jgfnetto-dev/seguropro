import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  const res = await client.query(`
    SELECT grantee, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'usuarios'
    ORDER BY grantee, privilege_type;
  `)
  console.log(JSON.stringify(res.rows, null, 2))
  await client.end()
}

main()
