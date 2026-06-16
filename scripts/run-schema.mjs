import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    process.env[key] = value
  }
}

const poolerUrl = process.argv[2]
if (!poolerUrl) {
  loadEnv(path.resolve(__dirname, '../.env.local'))
}

const { Client } = pg

const schemaSql = fs.readFileSync(path.resolve(__dirname, '../supabase/schema.sql'), 'utf-8')

const bucketSql = `
INSERT INTO storage.buckets (id, name, public)
VALUES ('apolices-pdf', 'apolices-pdf', true)
ON CONFLICT (id) DO NOTHING;
`

const storagePoliciesSql = `
DROP POLICY IF EXISTS "auth_upload" ON storage.objects;
CREATE POLICY "auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'apolices-pdf' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "public_read" ON storage.objects;
CREATE POLICY "public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'apolices-pdf');
`

async function main() {
  const client = new Client({ connectionString: poolerUrl || process.env.DATABASE_URL })
  await client.connect()
  console.log('Conectado ao banco.')

  try {
    await client.query(schemaSql)
    console.log('✓ Tabelas, RLS e políticas criadas.')
  } catch (err) {
    console.error('Erro ao rodar schema.sql:', err.message)
    throw err
  }

  try {
    await client.query(bucketSql)
    console.log('✓ Bucket apolices-pdf criado/confirmado.')
  } catch (err) {
    console.error('Erro ao criar bucket:', err.message)
  }

  try {
    await client.query(storagePoliciesSql)
    console.log('✓ Políticas de storage criadas.')
  } catch (err) {
    console.error('Erro ao criar políticas de storage:', err.message)
  }

  await client.end()
  console.log('Concluído.')
}

main().catch((err) => {
  console.error('Falha geral:', err)
  process.exit(1)
})
