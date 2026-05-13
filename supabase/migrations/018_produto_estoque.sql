-- Tabela de vínculo entre produtos do cardápio e itens de estoque
CREATE TABLE IF NOT EXISTS produto_estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  estoque_id UUID NOT NULL REFERENCES estoque(id) ON DELETE CASCADE,
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 1,
  UNIQUE(produto_id, estoque_id)
);

ALTER TABLE produto_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_produto_estoque" ON produto_estoque
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Função atômica para decrementar estoque (não deixa ir abaixo de 0)
CREATE OR REPLACE FUNCTION decrement_estoque(p_estoque_id UUID, p_quantidade DECIMAL)
RETURNS void LANGUAGE sql AS $$
  UPDATE estoque
  SET quantidade = GREATEST(0, quantidade - p_quantidade),
      atualizado_em = NOW()
  WHERE id = p_estoque_id;
$$;
