-- Tabela de feedbacks de clientes (sugestões e bugs)
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sugestao', 'bug')),
  mensagem TEXT NOT NULL,
  resolvido BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Apenas service_role pode ler/escrever (acesso via backend com admin client)
CREATE POLICY "feedbacks_service_role_only" ON feedbacks
  FOR ALL USING (auth.role() = 'service_role');
