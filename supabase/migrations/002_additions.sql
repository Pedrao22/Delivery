-- ============================================================
-- PEDI&RECEBE - Adições ao schema (Migration 002)
-- ============================================================

-- chat no pedido (histórico de mensagens do pedido)
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS chat JSONB DEFAULT '[]';

-- tabela de prêmios de fidelidade (separada de fidelidade_config)
CREATE TABLE IF NOT EXISTS fidelidade_premios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  pontos INTEGER NOT NULL DEFAULT 0,
  tipo VARCHAR(50) DEFAULT 'desconto',
  valor DECIMAL(10,2) DEFAULT 0,
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelidade_premios_restaurante ON fidelidade_premios(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_fidelidade_premios_ativo ON fidelidade_premios(ativo);

DROP TRIGGER IF EXISTS trg_fidelidade_premios_updated ON fidelidade_premios;
CREATE TRIGGER trg_fidelidade_premios_updated
  BEFORE UPDATE ON fidelidade_premios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
