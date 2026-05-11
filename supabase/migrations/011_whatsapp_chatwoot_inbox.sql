-- Inbox do Chatwoot por restaurante (para separar conversas multi-tenant)
ALTER TABLE restaurantes
ADD COLUMN IF NOT EXISTS chatwoot_inbox_id INTEGER DEFAULT NULL;
