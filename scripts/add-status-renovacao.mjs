import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
CREATE TABLE IF NOT EXISTS status_renovacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  apolice_id uuid REFERENCES apolices(id) NOT NULL,
  numero_apolice text NOT NULL,
  data date NOT NULL,
  status text NOT NULL CHECK (status IN ('Proposta', 'Renovada', 'Cancelada')),
  observacao text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE status_renovacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "status_renovacao_corretora" ON status_renovacao;
CREATE POLICY "status_renovacao_corretora" ON status_renovacao FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

GRANT ALL ON status_renovacao TO service_role, authenticated;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Tabela status_renovacao criada com RLS e permissões.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
