const _raw = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
export const API_URL = _raw.endsWith('/api') ? _raw : _raw.replace(/\/$/, '') + '/api';

const TOKEN_KEY = 'pedirecebe_token';
const REFRESH_KEY = 'pedirecebe_refresh';
const EXPIRES_KEY = 'pedirecebe_expires';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeSession(session) {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_KEY, session.refresh_token);
  localStorage.setItem(EXPIRES_KEY, String(session.expires_at));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

async function getValidToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const expiresAt = parseInt(localStorage.getItem(EXPIRES_KEY) || '0', 10);
  const nowSeconds = Math.floor(Date.now() / 1000);

  // Renew if less than 60s left
  if (expiresAt - nowSeconds > 60) return token;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) { clearSession(); return null; }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) { clearSession(); return null; }
    const data = await res.json();
    storeSession(data.data);
    return data.data.access_token;
  } catch {
    clearSession();
    return null;
  }
}

// Sync headers for direct fetch() calls — não faz refresh, use apiFetch quando possível
export function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  const impersonateId = localStorage.getItem('pedirecebe_impersonate_id');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(impersonateId ? { 'X-Impersonate-Restaurant-Id': impersonateId } : {}),
  };
}

export async function apiFetch(path, options = {}) {
  const { skipAuth, ...fetchOptions } = options;
  const token = skipAuth ? null : await getValidToken();
  const impersonateId = localStorage.getItem('pedirecebe_impersonate_id');

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(impersonateId ? { 'X-Impersonate-Restaurant-Id': impersonateId } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.message || 'Erro na requisição');
    err.status = response.status;
    throw err;
  }
  return data;
}
