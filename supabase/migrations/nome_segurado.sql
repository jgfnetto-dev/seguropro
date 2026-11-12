-- Adiciona campo nome_segurado na tabela clientes
-- Usado quando o PDF da apólice tem TOMADOR e SEGURADO distintos:
-- o TOMADOR é gravado em clientes.segurado e o SEGURADO em clientes.nome_segurado

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nome_segurado TEXT;
