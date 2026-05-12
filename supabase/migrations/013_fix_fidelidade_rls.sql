-- Corrige RLS policies da fidelidade que usavam id = auth.uid() (errado)
-- em vez de auth_id = auth.uid() (correto)

-- fidelidade_clientes
DROP POLICY IF EXISTS "fidelidade_clientes_super_all" ON fidelidade_clientes;
DROP POLICY IF EXISTS "fidelidade_clientes_admin_own" ON fidelidade_clientes;

CREATE POLICY "fidelidade_clientes_super_all" ON fidelidade_clientes
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM usuarios WHERE auth_id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM usuarios WHERE auth_id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "fidelidade_clientes_admin_own" ON fidelidade_clientes
  FOR ALL TO authenticated
  USING (
    restaurante_id = (SELECT restaurante_id FROM usuarios WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    restaurante_id = (SELECT restaurante_id FROM usuarios WHERE auth_id = auth.uid())
  );

-- fidelidade_premios
DROP POLICY IF EXISTS "fidelidade_premios_super_all" ON fidelidade_premios;
DROP POLICY IF EXISTS "fidelidade_premios_admin_own" ON fidelidade_premios;

CREATE POLICY "fidelidade_premios_super_all" ON fidelidade_premios
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM usuarios WHERE auth_id = auth.uid()) = 'super_admin'
  )
  WITH CHECK (
    (SELECT role FROM usuarios WHERE auth_id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "fidelidade_premios_admin_own" ON fidelidade_premios
  FOR ALL TO authenticated
  USING (
    restaurante_id = (SELECT restaurante_id FROM usuarios WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    restaurante_id = (SELECT restaurante_id FROM usuarios WHERE auth_id = auth.uid())
  );
