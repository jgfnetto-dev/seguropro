import pg from 'pg'

const poolerUrl = process.argv[2]
if (!poolerUrl) {
  console.error('Uso: node add-unique-constraint.mjs <poolerUrl>')
  process.exit(1)
}

const { Client } = pg

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'apolices_cliente_numero_unique'
  ) THEN
    ALTER TABLE apolices ADD CONSTRAINT apolices_cliente_numero_unique UNIQUE (cliente_id, numero_apolice);
  END IF;
END $$;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  try {
    await client.query(sql)
    console.log('✓ Constraint apolices_cliente_numero_unique aplicada (ou já existia).')
  } catch (err) {
    console.error('Erro:', err.message)
    if (err.code === '23505') {
      console.error('Já existem apólices duplicadas (mesmo cliente + número) na base. Resolva antes de aplicar a constraint.')
    }
    throw err
  } finally {
    await client.end()
  }
}

main().catch(() => process.exit(1))
