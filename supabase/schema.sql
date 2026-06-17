-- SeguroPro Database Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS corretoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  email text UNIQUE NOT NULL,
  nome text NOT NULL,
  telefone_whatsapp text,
  adm text NOT NULL DEFAULT 'N' CHECK (adm IN ('S', 'N')),
  notificacao_renovacoes_enviada_em date,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seguradoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  codigo text NOT NULL,
  nome text NOT NULL,
  ramos text[] NOT NULL,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  segurado text NOT NULL,
  cpf_cnpj text NOT NULL,
  email text,
  telefone text,
  pf_pj text NOT NULL CHECK (pf_pj IN ('PF', 'PJ')),
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS apolices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corretora_id uuid REFERENCES corretoras(id) NOT NULL,
  cliente_id uuid REFERENCES clientes(id) NOT NULL,
  seguradora_id uuid REFERENCES seguradoras(id) NOT NULL,
  numero_apolice text NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  tipo_seguro text NOT NULL,
  premio_liquido numeric(12,2) NOT NULL,
  premio_total numeric(12,2) NOT NULL,
  comissao_percentual numeric(5,2),
  pdf_url text,
  criado_em timestamptz DEFAULT now(),
  CONSTRAINT apolices_cliente_numero_unique UNIQUE (cliente_id, numero_apolice)
);

-- Enable RLS
ALTER TABLE corretoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguradoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE apolices ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their corretora's data
DROP POLICY IF EXISTS "usuarios_own" ON usuarios;
CREATE POLICY "usuarios_own" ON usuarios FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS "seguradoras_corretora" ON seguradoras;
CREATE POLICY "seguradoras_corretora" ON seguradoras FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "clientes_corretora" ON clientes;
CREATE POLICY "clientes_corretora" ON clientes FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "apolices_corretora" ON apolices;
CREATE POLICY "apolices_corretora" ON apolices FOR ALL
  USING (corretora_id = (SELECT corretora_id FROM usuarios WHERE id = auth.uid()));

-- Storage bucket (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('apolices-pdf', 'apolices-pdf', true);

-- Storage policy
-- CREATE POLICY "auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'apolices-pdf' AND auth.role() = 'authenticated');
-- CREATE POLICY "public_read" ON storage.objects FOR SELECT USING (bucket_id = 'apolices-pdf');

-- Helper: create a new broker + user (run after registration)
-- INSERT INTO corretoras (nome) VALUES ('Nome da Corretora') RETURNING id;
-- INSERT INTO usuarios (id, corretora_id, email, nome) VALUES (auth.uid(), '<corretora_id>', 'email@exemplo.com', 'Nome');
