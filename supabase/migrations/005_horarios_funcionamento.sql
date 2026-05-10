-- Adiciona coluna de horários de funcionamento por dia da semana
ALTER TABLE restaurantes
ADD COLUMN IF NOT EXISTS horarios JSONB DEFAULT '{
  "segunda":  {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "terca":    {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "quarta":   {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "quinta":   {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "sexta":    {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "sabado":   {"ativo": true,  "abertura": "11:00", "fechamento": "23:00"},
  "domingo":  {"ativo": false, "abertura": "11:00", "fechamento": "23:00"}
}'::jsonb;
