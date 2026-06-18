import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
CREATE TABLE IF NOT EXISTS historico_renovacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  numero_apolice text NOT NULL,
  status_final text NOT NULL CHECK (status_final IN ('Renovada', 'Cancelada')),
  apolice jsonb NOT NULL,
  cliente jsonb NOT NULL,
  seguradora jsonb,
  conciliacoes jsonb NOT NULL DEFAULT '[]',
  endossos jsonb NOT NULL DEFAULT '[]',
  status_renovacoes jsonb NOT NULL DEFAULT '[]',
  arquivado_em timestamptz DEFAULT now()
);

ALTER TABLE historico_renovacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico_renovacao_corretora" ON historico_renovacao;
CREATE POLICY "historico_renovacao_corretora" ON historico_renovacao FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

GRANT ALL ON historico_renovacao TO service_role, authenticated;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Tabela historico_renovacao criada com RLS e permissões.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
