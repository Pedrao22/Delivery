-- Garante que a coluna horarios existe e preenche linhas com NULL
-- Rode este SQL no painel do Supabase → SQL Editor se os horários não persistem

ALTER TABLE restaurantes
ADD COLUMN IF NOT EXISTS horarios JSONB;

UPDATE restaurantes
SET horarios = '{
  "segunda":  {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "terca":    {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "quarta":   {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "quinta":   {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "sexta":    {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "sabado":   {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "domingo":  {"ativo": false, "abertura": "11:00", "fechamento": "23:00"}
}'::jsonb
WHERE horarios IS NULL;
