-- Adiciona cupom e desconto ao pedido
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS coupon_used VARCHAR(50),
ADD COLUMN IF NOT EXISTS descontos DECIMAL(10,2) NOT NULL DEFAULT 0;
