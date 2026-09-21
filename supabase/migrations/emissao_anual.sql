-- Tabela de snapshot anual de prêmio líquido por corretora
-- Preserva os totais históricos mesmo quando apólices são movidas para o histórico ou excluídas

CREATE TABLE IF NOT EXISTS emissao_anual (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  corretora_id  uuid NOT NULL REFERENCES corretoras(id) ON DELETE CASCADE,
  ano           integer NOT NULL,
  total_premio_liquido numeric(14,2) NOT NULL DEFAULT 0,
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(corretora_id, ano)
);

-- Inicializa com os dados atuais da tabela apolices (execução única)
INSERT INTO emissao_anual (corretora_id, ano, total_premio_liquido)
SELECT
  corretora_id,
  EXTRACT(YEAR FROM data_emissao::date)::integer AS ano,
  SUM(COALESCE(premio_liquido, 0))               AS total_premio_liquido
FROM apolices
WHERE data_emissao IS NOT NULL
  AND corretora_id IS NOT NULL
GROUP BY corretora_id, EXTRACT(YEAR FROM data_emissao::date)::integer
ON CONFLICT (corretora_id, ano) DO UPDATE
  SET total_premio_liquido = EXCLUDED.total_premio_liquido,
      atualizado_em        = now();

-- RLS
ALTER TABLE emissao_anual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários leem emissao_anual da sua corretora" ON emissao_anual
  FOR SELECT USING (
    corretora_id IN (
      SELECT corretora_id FROM usuarios WHERE id = auth.uid()
    )
  );
