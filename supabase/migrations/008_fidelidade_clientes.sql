-- ============================================================
-- PEDI&RECEBE - Migration 008
-- Cria tabela fidelidade_clientes (referenciada pelo serviço mas ausente)
-- e garante que fidelidade_premios tem RLS correto
-- ============================================================

-- Tabela de clientes do programa de fidelidade
CREATE TABLE IF NOT EXISTS fidelidade_clientes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id   UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  cliente_telefone VARCHAR(30) NOT NULL,
  cliente_nome     VARCHAR(255),
  pontos           INTEGER NOT NULL DEFAULT 0,
  total_pedidos    INTEGER NOT NULL DEFAULT 0,
  total_gasto      DECIMAL(12,2) NOT NULL DEFAULT 0,
  criado_em        TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (restaurante_id, cliente_telefone)
);

CREATE INDEX IF NOT EXISTS idx_fidelidade_clientes_restaurante
  ON fidelidade_clientes(restaurante_id);

CREATE INDEX IF NOT EXISTS idx_fidelidade_clientes_telefone
  ON fidelidade_clientes(restaurante_id, cliente_telefone);

DROP TRIGGER IF EXISTS trg_fidelidade_clientes_updated ON fidelidade_clientes;
CREATE TRIGGER trg_fidelidade_clientes_updated
  BEFORE UPDATE ON fidelidade_clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE fidelidade_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fidelidade_clientes_super_all" ON fidelidade_clientes
  FOR ALL TO authenticated
  USING ((SELECT role FROM usuarios WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "fidelidade_clientes_admin_own" ON fidelidade_clientes
  FOR ALL TO authenticated
  USING (restaurante_id = (SELECT restaurante_id FROM usuarios WHERE id = auth.uid()));

-- Garante que fidelidade_premios tem RLS habilitado (idempotente)
ALTER TABLE fidelidade_premios ENABLE ROW LEVEL SECURITY;

-- Recria policies de fidelidade_premios se ainda não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fidelidade_premios' AND policyname = 'fidelidade_premios_super_all'
  ) THEN
    CREATE POLICY "fidelidade_premios_super_all" ON fidelidade_premios
      FOR ALL TO authenticated
      USING ((SELECT role FROM usuarios WHERE id = auth.uid()) = 'super_admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'fidelidade_premios' AND policyname = 'fidelidade_premios_admin_own'
  ) THEN
    CREATE POLICY "fidelidade_premios_admin_own" ON fidelidade_premios
      FOR ALL TO authenticated
      USING (restaurante_id = (SELECT restaurante_id FROM usuarios WHERE id = auth.uid()));
  END IF;
END $$;
