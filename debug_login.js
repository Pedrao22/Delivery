import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymfgdkcxtgjbzovpvyut.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZmdka2N4dGdqYnpvdnB2eXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMjgwMCwiZXhwIjoyMDkyMDk4ODAwfQ.m4vanuFiVnJAYQCZrUMLr1nPDSPwEOFZHtL7N8E62V8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZmdka2N4dGdqYnpvdnB2eXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjI4MDAsImV4cCI6MjA5MjA5ODgwMH0.Fq6FqnjZbqGFfYXgnJmy-wJaZsHZAkXTRpC99GsQX54');

async function debugLogin() {
  console.log('🔍 Testando Login no Supabase Core com: pedropgelasko11@gmail.com / Delivery@123');
  
  const { data: authData, error: authErr } = await supabaseAnon.auth.signInWithPassword({
    email: 'pedropgelasko11@gmail.com',
    password: 'Delivery@123',
  });

  if (authErr) {
    console.error('❌ Resultado do Login:', authErr.message);
    
    console.log('🔄 Tentando ler a tabela auth.users pelo Admin (apenas Service Role pode)...');
    const { data: listUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listErr) {
       console.error('Falha ao listar auth.users:', listErr.message);
    } else {
       const userCore = listUsers.users.find(u => u.email === 'pedropgelasko11@gmail.com');
       if (!userCore) {
         console.log('⚠️ ALERTA CRÍTICO: O e-mail NÃO EXISTE no Painel Authentication do Supabase (auth.users). Ele só existe na sua tabela pública "usuarios".');
         console.log('🛠️ Iniciando a criação Forçada de Identidade Auth & Sincronização...');
         
         const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: 'pedropgelasko11@gmail.com',
            password: 'Delivery@123',
            email_confirm: true
         });
         
         if(createErr) {
             console.log('Erro ao criar no Auth Core:', createErr);
         } else {
             console.log('✅ Identidade Criada no Auth Core! ID: ', newUser.user.id);
             console.log('🛠️ Atualizando ID na tabela usuarios public...');
             
             // Atualiza a tabela com a ID verdadeira do Auth
             await supabaseAdmin.from('usuarios')
               .update({ auth_id: newUser.user.id })
               .eq('email', 'pedropgelasko11@gmail.com');
               
             console.log('✅ Tudo sincronizado! Login deve funcionar AGORA!');
         }
       } else {
         console.log('O E-mail existe no Auth Core. ID:', userCore.id);
         console.log('Talvez a senha anterior não aplicou direito? Vou tentar resetar de novo usando o ID direto.');
         await supabaseAdmin.auth.admin.updateUserById(userCore.id, { password: 'Delivery@123', email_confirm: true });
         console.log('Senha re-forçada.');
       }
    }
  } else {
    console.log('✅ SUCESSO: Login passou sem erros localmente. Token recebido:', authData.session.access_token.substring(0, 15) + '...');
  }
}

debugLogin();
