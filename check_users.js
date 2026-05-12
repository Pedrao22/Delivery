
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymfgdkcxtgjbzovpvyut.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZmdka2N4dGdqYnpvdnB2eXV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMjgwMCwiZXhwIjoyMDkyMDk4ODAwfQ.m4vanuFiVnJAYQCZrUMLr1nPDSPwEOFZHtL7N8E62V8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('nome, email, role');

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('--- USUÁRIOS NO BANCO ---');
  console.table(data);
}

checkUsers();
