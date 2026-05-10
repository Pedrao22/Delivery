-- ============================================================
-- SECURITY FIX: Correções de segurança identificadas em auditoria
-- ============================================================

-- 1. fidelidade_premios: habilitar RLS + policies
ALTER TABLE public.fidelidade_premios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fidelidade_premios_super_all" ON public.fidelidade_premios
  FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "fidelidade_premios_admin_own" ON public.fidelidade_premios
  FOR ALL
  USING (restaurante_id = (SELECT restaurante_id FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1))
  WITH CHECK (restaurante_id = (SELECT restaurante_id FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1));

-- 2. historico_tarefas: restringir leitura por tenant
DROP POLICY IF EXISTS "historico_read_authenticated" ON public.historico_tarefas;

CREATE POLICY "historico_read_own" ON public.historico_tarefas
  FOR SELECT USING (
    is_super_admin()
    OR (
      SELECT restaurante_id FROM public.tarefas_kanban
      WHERE id = historico_tarefas.tarefa_id LIMIT 1
    ) = (
      SELECT restaurante_id FROM public.usuarios
      WHERE auth_id = auth.uid() LIMIT 1
    )
  );

-- 3. configuracoes_globais: restringir leitura a super_admin
DROP POLICY IF EXISTS "config_read_authenticated" ON public.configuracoes_globais;

CREATE POLICY "config_read_super_only" ON public.configuracoes_globais
  FOR SELECT USING (is_super_admin());

-- 4. chatwoot_conversations: remover policy bloqueante
-- (service_role ignora RLS por design; a policy USING(false) bloqueia tudo desnecessariamente)
DROP POLICY IF EXISTS "service only" ON public.chatwoot_conversations;

-- 5. logs_auditoria: garantir que restaurante_id seja válido
DROP POLICY IF EXISTS "logs_insert_authenticated" ON public.logs_auditoria;

CREATE POLICY "logs_insert_own" ON public.logs_auditoria
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      restaurante_id IS NULL
      OR is_super_admin()
      OR restaurante_id = (
        SELECT restaurante_id FROM public.usuarios
        WHERE auth_id = auth.uid() LIMIT 1
      )
    )
  );

-- 6. pedidos: adicionar NOT NULL em status e tipo
ALTER TABLE public.pedidos
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN tipo   SET NOT NULL;
