import pg from 'pg'

const poolerUrl = process.argv[2]
if (!poolerUrl) {
  console.error('Uso: node find-duplicates.mjs <poolerUrl>')
  process.exit(1)
}

const { Client } = pg

const sql = `
SELECT a.cliente_id, c.segurado, a.numero_apolice, array_agg(a.id ORDER BY a.criado_em) as ids, array_agg(a.criado_em ORDER BY a.criado_em) as datas
FROM apolices a
JOIN clientes c ON c.id = a.cliente_id
GROUP BY a.cliente_id, c.segurado, a.numero_apolice
HAVING COUNT(*) > 1;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  const { rows } = await client.query(sql)
  console.log(JSON.stringify(rows, null, 2))
  await client.end()
}

main()
