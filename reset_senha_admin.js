import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymfgdkcxtgjbzovpvyut.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZmdka2N4dGdqYnpvdnB2eXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMjgwMCwiZXhwIjoyMDkyMDk4ODAwfQ.m4vanuFiVnJAYQCZrUMLr1nPDSPwEOFZHtL7N8E62V8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function overridePassword() {
  console.log('🔄 Iniciando Sobreposição Master...');
  
  // 1. Busca o ID verdadeiro do seu e-mail
  const { data: userData, error: fetchErr } = await supabase
    .from('usuarios')
    .select('auth_id')
    .eq('email', 'pedropgelasko11@gmail.com')
    .single();

  if (fetchErr || !userData) {
    console.error('❌ CEO não encontrado na tabela de usuários:', fetchErr);
    return;
  }

  const adminAuthId = userData.auth_id;
  const newPassword = 'Delivery@123'; // Senha padrão forte o suficiente para o Supabase
  
  // 2. Força a nova senha via bypass Admin API
  const { error: updateErr } = await supabase.auth.admin.updateUserById(
    adminAuthId,
    { password: newPassword, email_confirm: true }
  );

  if (updateErr) {
    console.error('❌ Falha ao injetar a nova senha:', updateErr.message);
  } else {
    console.log('✅ SUCESSO! Senha do CEO sobregravada com autoridade.');
    console.log('--- SUAS NOVAS CREDENCIAIS ---');
    console.log('E-mail: pedropgelasko11@gmail.com');
    console.log('Senha : ' + newPassword);
  }
}

overridePassword();
