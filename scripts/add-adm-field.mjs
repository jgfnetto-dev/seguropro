import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS adm text NOT NULL DEFAULT 'N';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_adm_check'
  ) THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_adm_check CHECK (adm IN ('S', 'N'));
  END IF;
END $$;

-- Marca como administrador (S) o usuário mais antigo de cada corretora
UPDATE usuarios SET adm = 'S'
WHERE id IN (
  SELECT DISTINCT ON (corretora_id) id
  FROM usuarios
  ORDER BY corretora_id, criado_em ASC
);
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  const { rows } = await client.query('SELECT nome, email, adm, corretora_id FROM usuarios ORDER BY corretora_id, criado_em')
  console.log('✓ Campo adm criado e administradores marcados.')
  console.log(JSON.stringify(rows, null, 2))
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
