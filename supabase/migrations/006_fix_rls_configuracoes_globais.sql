-- Garante RLS ativo e policies corretas na tabela configuracoes_globais
-- (a tabela já existe mas o advisor do Supabase detectou RLS desativado)

ALTER TABLE public.configuracoes_globais ENABLE ROW LEVEL SECURITY;

-- Recria policies para evitar duplicação
DROP POLICY IF EXISTS "config_super_all"            ON public.configuracoes_globais;
DROP POLICY IF EXISTS "config_read_authenticated"   ON public.configuracoes_globais;

-- Somente super_admin pode escrever/deletar
CREATE POLICY "config_super_all" ON public.configuracoes_globais
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Qualquer usuário autenticado pode ler
CREATE POLICY "config_read_authenticated" ON public.configuracoes_globais
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
