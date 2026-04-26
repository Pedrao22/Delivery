import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When env vars are missing, create a safe stub so the app renders (shows login)
// instead of crashing with "supabaseUrl is required"
const createMockClient = () => ({
  auth: {
    onAuthStateChange: (cb) => {
      setTimeout(() => cb('INITIAL_SESSION', null), 0);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => {
      throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.');
    },
    signOut: async () => {},
  },
});

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : createMockClient();

// Normalize: always ensure the URL ends with /api regardless of how env var is set
const _raw = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
export const API_URL = _raw.endsWith('/api') ? _raw : _raw.replace(/\/$/, '') + '/api';

export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const impersonateId = localStorage.getItem('pedirecebe_impersonate_id');

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(impersonateId ? { 'X-Impersonate-Restaurant-Id': impersonateId } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Erro na requisição');
  return data;
}
