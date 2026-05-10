-- Adiciona colunas de entregador no pedido
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS entregador_nome VARCHAR(255),
ADD COLUMN IF NOT EXISTS entregador_telefone VARCHAR(30);
