import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
CREATE TABLE IF NOT EXISTS endossos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  apolice_id uuid REFERENCES apolices(id) NOT NULL,
  numero_apolice text NOT NULL,
  numero_endosso text NOT NULL,
  tipo_endosso text,
  segurado text,
  data_emissao date,
  data_inicio date,
  data_fim date,
  pdf_url text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE endossos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "endossos_corretora" ON endossos;
CREATE POLICY "endossos_corretora" ON endossos FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

GRANT ALL ON endossos TO service_role, authenticated;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Tabela endossos criada com RLS e permissões.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
