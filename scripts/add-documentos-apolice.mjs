import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
CREATE TABLE IF NOT EXISTS documentos_apolice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  apolice_id uuid REFERENCES apolices(id) NOT NULL,
  numero_apolice text NOT NULL,
  nome_documento text NOT NULL,
  documento_url text NOT NULL,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE documentos_apolice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentos_apolice_corretora" ON documentos_apolice;
CREATE POLICY "documentos_apolice_corretora" ON documentos_apolice FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

GRANT ALL ON documentos_apolice TO service_role, authenticated;

ALTER TABLE historico_renovacao ADD COLUMN IF NOT EXISTS documentos jsonb NOT NULL DEFAULT '[]';
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Tabela documentos_apolice criada com RLS e permissões. Coluna documentos adicionada em historico_renovacao.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
