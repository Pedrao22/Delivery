-- ============================================================
-- 🚀 PEDI&RECEBE - SCHEMA COMPLETO (SUPABASE)
-- Cole TUDO isso no SQL Editor do Supabase e clique "Run"
-- ============================================================

-- ============================================
-- 1. EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_status AS ENUM ('active', 'inactive', 'trial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE restaurant_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('analyzing', 'production', 'ready', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('delivery', 'pickup', 'local');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE table_status AS ENUM ('free', 'occupied', 'reserved', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE driver_status AS ENUM ('available', 'delivering', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'responded', 'converted', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bug_severity AS ENUM ('baixa', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bug_status AS ENUM ('aberto', 'em_andamento', 'resolvido', 'fechado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE suggestion_status AS ENUM ('nova', 'em_analise', 'aprovada', 'rejeitada', 'implementada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kanban_status AS ENUM ('backlog', 'todo', 'doing', 'review', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kanban_priority AS ENUM ('baixa', 'media', 'alta', 'critica');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'create', 'update', 'delete', 'login', 'logout',
    'impersonate', 'plan_change', 'status_change',
    'password_reset', 'move_order'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. FUNÇÃO AUXILIAR: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TABELAS CORE (Sprint 0)
-- ============================================================

-- ────────────────────────────────────────────
-- PLANOS (deve existir antes de restaurantes)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  intervalo VARCHAR(20) DEFAULT 'mensal',
  recursos JSONB DEFAULT '{}',
  limite_pedidos INTEGER,
  limite_produtos INTEGER,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- RESTAURANTES (tenant principal)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  endereco TEXT,
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#e74c3c',
  status restaurant_status DEFAULT 'active',
  plano_id UUID REFERENCES planos(id) ON DELETE SET NULL,
  is_open BOOLEAN DEFAULT true,
  min_order DECIMAL(10,2) DEFAULT 30.00,
  delivery_time VARCHAR(50) DEFAULT '30-45 min',
  payments_config JSONB DEFAULT '{"pix_online":true,"pix_balcao":true,"card_debit":true,"card_credit":true,"cash":true}',
  pix_key VARCHAR(255),
  config JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  deletado_em TIMESTAMPTZ DEFAULT NULL
);

-- ────────────────────────────────────────────
-- USUÁRIOS (referencia Supabase Auth)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'admin',
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  ultimo_login TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  deletado_em TIMESTAMPTZ DEFAULT NULL
);

-- ────────────────────────────────────────────
-- ASSINATURAS (restaurante <-> plano)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,
  status plan_status DEFAULT 'active',
  inicio TIMESTAMPTZ DEFAULT NOW(),
  vencimento TIMESTAMPTZ,
  gateway_key TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- LOGS DE AUDITORIA
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
  acao audit_action NOT NULL,
  entidade VARCHAR(100),
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip VARCHAR(45),
  user_agent TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TABELAS OPERACIONAIS DO RESTAURANTE (Sprint 1+)
-- ============================================================

-- ────────────────────────────────────────────
-- CATEGORIAS DO CARDÁPIO
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  icone VARCHAR(10) DEFAULT '🍽️',
  slug VARCHAR(100),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- PRODUTOS DO CARDÁPIO
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  imagem_url TEXT,
  imagem_emoji VARCHAR(10) DEFAULT '🍽️',
  bestseller BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  prep_time VARCHAR(50),
  variacoes JSONB DEFAULT '[]',
  complementos JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  deletado_em TIMESTAMPTZ DEFAULT NULL
);

-- ────────────────────────────────────────────
-- ENTREGADORES (precisa existir antes de pedidos)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entregadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  veiculo VARCHAR(50),
  foto_url TEXT,
  foto_emoji VARCHAR(10),
  status driver_status DEFAULT 'available',
  pedido_atual_id UUID,
  rating DECIMAL(2,1) DEFAULT 0,
  total_entregas INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- PEDIDOS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  codigo VARCHAR(20) NOT NULL,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_telefone VARCHAR(20),
  cliente_endereco TEXT,
  itens JSONB NOT NULL DEFAULT '[]',
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status order_status DEFAULT 'analyzing',
  tipo order_type DEFAULT 'delivery',
  pagamento VARCHAR(50),
  troco_para DECIMAL(10,2),
  observacao TEXT,
  codigo_confirmacao VARCHAR(10),
  entregador_id UUID REFERENCES entregadores(id) ON DELETE SET NULL,
  mesa_id UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  finalizado_em TIMESTAMPTZ
);

-- ────────────────────────────────────────────
-- ESTOQUE / INSUMOS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estoque (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  quantidade DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantidade_minima DECIMAL(10,2) DEFAULT 0,
  unidade VARCHAR(20) DEFAULT 'un',
  fornecedor VARCHAR(255),
  validade DATE,
  custo_unitario DECIMAL(10,2),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- MESAS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mesas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  numero VARCHAR(10) NOT NULL,
  status table_status DEFAULT 'free',
  capacidade INTEGER DEFAULT 4,
  pedido_atual_id UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- LEADS / ATENDIMENTO (CHAT)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_telefone VARCHAR(20),
  ultima_mensagem TEXT,
  status lead_status DEFAULT 'new',
  nao_lido BOOLEAN DEFAULT true,
  chat JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- CUPONS
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'percentage',
  valor DECIMAL(10,2) NOT NULL DEFAULT 0,
  pedido_minimo DECIMAL(10,2) DEFAULT 0,
  limite_uso INTEGER,
  usos INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  validade TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- FIDELIDADE (CONFIGURAÇÃO)
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fidelidade_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID UNIQUE NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  pontos_por_real INTEGER DEFAULT 10,
  recompensas JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- CLIENTES DO RESTAURANTE
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  pontos_fidelidade INTEGER DEFAULT 0,
  total_pedidos INTEGER DEFAULT 0,
  total_gasto DECIMAL(10,2) DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABELAS DE PAGAMENTO (Sprint 3)
-- ============================================================

CREATE TABLE IF NOT EXISTS logs_pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurante_id UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  assinatura_id UUID REFERENCES assinaturas(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  gateway_id VARCHAR(255),
  metodo VARCHAR(50),
  dados JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. TABELAS KANBAN (Sprint 6)
-- ============================================================

CREATE TABLE IF NOT EXISTS tarefas_kanban (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status kanban_status DEFAULT 'backlog',
  prioridade kanban_priority DEFAULT 'media',
  responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
  ordem INTEGER DEFAULT 0,
  data_limite TIMESTAMPTZ,
  tags JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historico_tarefas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarefa_id UUID NOT NULL REFERENCES tarefas_kanban(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  campo VARCHAR(100),
  valor_anterior TEXT,
  valor_novo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. TABELAS BUGS E SUGESTÕES (Sprint 7)
-- ============================================================

CREATE TABLE IF NOT EXISTS bugs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  severidade bug_severity DEFAULT 'media',
  status bug_status DEFAULT 'aberto',
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
  reportado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tarefa_kanban_id UUID REFERENCES tarefas_kanban(id) ON DELETE SET NULL,
  screenshots JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sugestoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(50),
  status suggestion_status DEFAULT 'nova',
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE SET NULL,
  sugerido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  votos INTEGER DEFAULT 0,
  tarefa_kanban_id UUID REFERENCES tarefas_kanban(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. CONFIGURAÇÕES GLOBAIS (Sprint 8)
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracoes_globais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descricao TEXT,
  atualizado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. ÍNDICES
-- ============================================================

-- Core
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_id ON usuarios(auth_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_restaurante ON usuarios(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_restaurantes_status ON restaurantes(status);
CREATE INDEX IF NOT EXISTS idx_restaurantes_deletado ON restaurantes(deletado_em);
CREATE INDEX IF NOT EXISTS idx_restaurantes_cnpj ON restaurantes(cnpj);

-- Auditoria
CREATE INDEX IF NOT EXISTS idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_restaurante ON logs_auditoria(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_logs_criado ON logs_auditoria(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs_auditoria(acao);

-- Assinaturas
CREATE INDEX IF NOT EXISTS idx_assinaturas_restaurante ON assinaturas(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_vencimento ON assinaturas(vencimento);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);

-- Operacional
CREATE INDEX IF NOT EXISTS idx_produtos_restaurante ON produtos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_categorias_restaurante ON categorias(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_restaurante ON pedidos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado ON pedidos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX IF NOT EXISTS idx_estoque_restaurante ON estoque(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_mesas_restaurante ON mesas(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_entregadores_restaurante ON entregadores(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_leads_restaurante ON leads(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_cupons_restaurante ON cupons(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_restaurante ON clientes(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);

-- Pagamentos
CREATE INDEX IF NOT EXISTS idx_pagamentos_restaurante ON logs_pagamentos(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_criado ON logs_pagamentos(criado_em DESC);

-- Kanban
CREATE INDEX IF NOT EXISTS idx_kanban_status ON tarefas_kanban(status);
CREATE INDEX IF NOT EXISTS idx_kanban_responsavel ON tarefas_kanban(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_kanban_restaurante ON tarefas_kanban(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_historico_tarefa ON historico_tarefas(tarefa_id);

-- Bugs & Sugestões
CREATE INDEX IF NOT EXISTS idx_bugs_restaurante ON bugs(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
CREATE INDEX IF NOT EXISTS idx_sugestoes_restaurante ON sugestoes(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_sugestoes_status ON sugestoes(status);

-- ============================================================
-- 11. TRIGGERS (updated_at automático)
-- ============================================================

DROP TRIGGER IF EXISTS trg_planos_updated ON planos;
CREATE TRIGGER trg_planos_updated
  BEFORE UPDATE ON planos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_restaurantes_updated ON restaurantes;
CREATE TRIGGER trg_restaurantes_updated
  BEFORE UPDATE ON restaurantes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_usuarios_updated ON usuarios;
CREATE TRIGGER trg_usuarios_updated
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_assinaturas_updated ON assinaturas;
CREATE TRIGGER trg_assinaturas_updated
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_categorias_updated ON categorias;
CREATE TRIGGER trg_categorias_updated
  BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_produtos_updated ON produtos;
CREATE TRIGGER trg_produtos_updated
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_pedidos_updated ON pedidos;
CREATE TRIGGER trg_pedidos_updated
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_estoque_updated ON estoque;
CREATE TRIGGER trg_estoque_updated
  BEFORE UPDATE ON estoque
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_mesas_updated ON mesas;
CREATE TRIGGER trg_mesas_updated
  BEFORE UPDATE ON mesas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_entregadores_updated ON entregadores;
CREATE TRIGGER trg_entregadores_updated
  BEFORE UPDATE ON entregadores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_leads_updated ON leads;
CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_cupons_updated ON cupons;
CREATE TRIGGER trg_cupons_updated
  BEFORE UPDATE ON cupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_fidelidade_updated ON fidelidade_config;
CREATE TRIGGER trg_fidelidade_updated
  BEFORE UPDATE ON fidelidade_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_clientes_updated ON clientes;
CREATE TRIGGER trg_clientes_updated
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_kanban_updated ON tarefas_kanban;
CREATE TRIGGER trg_kanban_updated
  BEFORE UPDATE ON tarefas_kanban
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_bugs_updated ON bugs;
CREATE TRIGGER trg_bugs_updated
  BEFORE UPDATE ON bugs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sugestoes_updated ON sugestoes;
CREATE TRIGGER trg_sugestoes_updated
  BEFORE UPDATE ON sugestoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em TODAS as tabelas
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE fidelidade_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas_kanban ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_globais ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- FUNÇÃO HELPER: verificar se é super_admin
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usuarios
    WHERE auth_id = auth.uid() AND role = 'super_admin' AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────
-- FUNÇÃO HELPER: pegar restaurant_id do user
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT restaurante_id FROM usuarios
    WHERE auth_id = auth.uid() AND ativo = true
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────
-- POLICIES: PLANOS
-- ────────────────────────────────────────────
CREATE POLICY "planos_read_all" ON planos
  FOR SELECT USING (true);

CREATE POLICY "planos_manage_super" ON planos
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ────────────────────────────────────────────
-- POLICIES: RESTAURANTES
-- ────────────────────────────────────────────
CREATE POLICY "restaurantes_super_all" ON restaurantes
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "restaurantes_admin_own" ON restaurantes
  FOR SELECT USING (id = get_user_restaurant_id());

CREATE POLICY "restaurantes_admin_update_own" ON restaurantes
  FOR UPDATE USING (id = get_user_restaurant_id())
  WITH CHECK (id = get_user_restaurant_id());

-- ────────────────────────────────────────────
-- POLICIES: USUÁRIOS
-- ────────────────────────────────────────────
CREATE POLICY "usuarios_super_all" ON usuarios
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "usuarios_own_read" ON usuarios
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "usuarios_admin_same_restaurant" ON usuarios
  FOR SELECT USING (restaurante_id = get_user_restaurant_id());

-- ────────────────────────────────────────────
-- POLICIES: ASSINATURAS
-- ────────────────────────────────────────────
CREATE POLICY "assinaturas_super_all" ON assinaturas
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "assinaturas_admin_own" ON assinaturas
  FOR SELECT USING (restaurante_id = get_user_restaurant_id());

-- ────────────────────────────────────────────
-- POLICIES: AUDITORIA
-- ────────────────────────────────────────────
CREATE POLICY "logs_super_all" ON logs_auditoria
  FOR ALL USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "logs_admin_own" ON logs_auditoria
  FOR SELECT USING (restaurante_id = get_user_restaurant_id());

CREATE POLICY "logs_insert_authenticated" ON logs_auditoria
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ────────────────────────────────────────────
-- MACRO: Policy padrão para tabelas do restaurante
-- (super_admin = tudo, admin = só seu restaurante)
-- ────────────────────────────────────────────

-- CATEGORIAS
CREATE POLICY "categorias_super_all" ON categorias
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "categorias_admin_own" ON categorias
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- PRODUTOS
CREATE POLICY "produtos_super_all" ON produtos
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "produtos_admin_own" ON produtos
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- PEDIDOS
CREATE POLICY "pedidos_super_all" ON pedidos
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "pedidos_admin_own" ON pedidos
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- ESTOQUE
CREATE POLICY "estoque_super_all" ON estoque
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "estoque_admin_own" ON estoque
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- MESAS
CREATE POLICY "mesas_super_all" ON mesas
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "mesas_admin_own" ON mesas
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- ENTREGADORES
CREATE POLICY "entregadores_super_all" ON entregadores
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "entregadores_admin_own" ON entregadores
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- LEADS
CREATE POLICY "leads_super_all" ON leads
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "leads_admin_own" ON leads
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- CUPONS
CREATE POLICY "cupons_super_all" ON cupons
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "cupons_admin_own" ON cupons
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- FIDELIDADE
CREATE POLICY "fidelidade_super_all" ON fidelidade_config
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "fidelidade_admin_own" ON fidelidade_config
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- CLIENTES
CREATE POLICY "clientes_super_all" ON clientes
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "clientes_admin_own" ON clientes
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- LOGS PAGAMENTOS
CREATE POLICY "pagamentos_super_all" ON logs_pagamentos
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "pagamentos_admin_own" ON logs_pagamentos
  FOR SELECT USING (restaurante_id = get_user_restaurant_id());

-- KANBAN
CREATE POLICY "kanban_super_all" ON tarefas_kanban
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "kanban_admin_own" ON tarefas_kanban
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- HISTÓRICO TAREFAS
CREATE POLICY "historico_super_all" ON historico_tarefas
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "historico_read_authenticated" ON historico_tarefas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- BUGS
CREATE POLICY "bugs_super_all" ON bugs
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "bugs_admin_own" ON bugs
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- SUGESTÕES
CREATE POLICY "sugestoes_super_all" ON sugestoes
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "sugestoes_admin_own" ON sugestoes
  FOR ALL USING (restaurante_id = get_user_restaurant_id())
  WITH CHECK (restaurante_id = get_user_restaurant_id());

-- CONFIGURAÇÕES GLOBAIS
CREATE POLICY "config_super_all" ON configuracoes_globais
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "config_read_authenticated" ON configuracoes_globais
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 13. SEED DATA (dados iniciais)
-- ============================================================

-- Planos padrão
INSERT INTO planos (nome, descricao, preco, intervalo, recursos, limite_pedidos, limite_produtos)
VALUES
  ('Gratuito', 'Plano básico para começar', 0, 'mensal',
   '{"cardapio":true,"pedidos":true,"dashboard":false,"estoque":false,"entregas":false,"financeiro":false,"chat":false,"fidelidade":false,"cupons":false}',
   50, 20),
  ('Starter', 'Para pequenos restaurantes', 79.90, 'mensal',
   '{"cardapio":true,"pedidos":true,"dashboard":true,"estoque":true,"entregas":false,"financeiro":false,"chat":true,"fidelidade":false,"cupons":true}',
   300, 100),
  ('Pro', 'Para restaurantes em crescimento', 149.90, 'mensal',
   '{"cardapio":true,"pedidos":true,"dashboard":true,"estoque":true,"entregas":true,"financeiro":true,"chat":true,"fidelidade":true,"cupons":true}',
   1000, 500),
  ('Enterprise', 'Sem limites, suporte premium', 299.90, 'mensal',
   '{"cardapio":true,"pedidos":true,"dashboard":true,"estoque":true,"entregas":true,"financeiro":true,"chat":true,"fidelidade":true,"cupons":true,"whitelabel":true,"api":true}',
   NULL, NULL)
ON CONFLICT DO NOTHING;

-- Configurações globais padrão
INSERT INTO configuracoes_globais (chave, valor, descricao)
VALUES
  ('taxa_plataforma', '{"percentual": 5, "tipo": "percentual"}', 'Taxa cobrada sobre cada pedido'),
  ('whitelabel', '{"habilitado": false, "logo_padrao": "🍔", "nome_padrao": "Pedi&Recebe"}', 'Configurações de white-label'),
  ('integracoes', '{"gateway_padrao": "mercado_pago", "sms_ativo": false, "email_service": "supabase"}', 'Integrações globais'),
  ('manutencao', '{"ativo": false, "mensagem": "Sistema em manutenção. Voltamos em breve!"}', 'Modo de manutenção')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- ✅ SCHEMA COMPLETO INSTALADO!
-- 
-- Próximos passos:
-- 1. Vá em Authentication > Users e crie seu primeiro user
-- 2. Execute o SQL abaixo SEPARADO para criar o super_admin
--    (substitua 'SEU_AUTH_USER_ID' pelo ID real)
-- ============================================================

-- ============================================================
-- 🔐 EXECUTE SEPARADO DEPOIS DE CRIAR O USER NO AUTH:
-- ============================================================
-- INSERT INTO usuarios (auth_id, nome, email, role)
-- VALUES (
--   'SEU_AUTH_USER_ID_AQUI',  -- copie da aba Authentication
--   'Super Admin',
--   'seuemail@exemplo.com',
--   'super_admin'
-- );
-- ============================================================
