import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_deve_ser_alterada boolean NOT NULL DEFAULT true;
-- Usuários que já existem e já usam o sistema não devem ser forçados a trocar a senha agora.
UPDATE usuarios SET senha_deve_ser_alterada = false WHERE criado_em < now();
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Coluna senha_deve_ser_alterada criada na tabela usuarios (usuários existentes marcados como false).')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
