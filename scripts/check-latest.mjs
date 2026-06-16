import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
SELECT a.id, a.numero_apolice, a.criado_em as apolice_criada_em, a.cliente_id,
       c.segurado, c.cpf_cnpj, c.criado_em as cliente_criado_em
FROM apolices a
JOIN clientes c ON c.id = a.cliente_id
ORDER BY a.criado_em DESC
LIMIT 3;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  const { rows } = await client.query(sql)
  console.log(JSON.stringify(rows, null, 2))
  await client.end()
}

main()
