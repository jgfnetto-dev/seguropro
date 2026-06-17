import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
CREATE TABLE IF NOT EXISTS conciliacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  apolice_id uuid REFERENCES apolices(id) NOT NULL,
  numero_apolice text NOT NULL,
  data_conciliacao date NOT NULL,
  valor_conciliar numeric(12,2) NOT NULL,
  comentario text,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE conciliacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conciliacao_corretora" ON conciliacao;
CREATE POLICY "conciliacao_corretora" ON conciliacao FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

GRANT ALL ON conciliacao TO service_role, authenticated;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Tabela conciliacao criada com RLS e permissões.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
