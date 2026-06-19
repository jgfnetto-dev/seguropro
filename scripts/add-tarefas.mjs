import pg from 'pg'

const poolerUrl = process.argv[2]
const { Client } = pg

const sql = `
CREATE TABLE IF NOT EXISTS tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  usuario_id uuid REFERENCES usuarios(id) NOT NULL,
  data date NOT NULL,
  hora time NOT NULL,
  tarefa text NOT NULL,
  whatsapp_enviado boolean NOT NULL DEFAULT false,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tarefas_corretora" ON tarefas;
CREATE POLICY "tarefas_corretora" ON tarefas FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

GRANT ALL ON tarefas TO service_role, authenticated;
`

async function main() {
  const client = new Client({ connectionString: poolerUrl })
  await client.connect()
  await client.query(sql)
  console.log('✓ Tabela tarefas criada com RLS e permissões.')
  await client.end()
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
