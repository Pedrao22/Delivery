-- Adiciona coluna para vincular pedido à conversa do Chatwoot
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS chatwoot_conversation_id INTEGER DEFAULT NULL;

-- Índice para buscas por conversa
CREATE INDEX IF NOT EXISTS idx_pedidos_chatwoot_conversation_id
ON pedidos (chatwoot_conversation_id)
WHERE chatwoot_conversation_id IS NOT NULL;
