import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch, storeSession, clearSession, getStoredToken, API_URL } from '../lib/supabase';

const AuthContext = createContext({});

const BACKEND_TIMEOUT_MS = 8_000;

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050510',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      fontFamily: "'Outfit', system-ui, sans-serif",
    }}>
      <style>{`@keyframes au-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 52,
        height: 52,
        border: '3px solid rgba(255,196,0,0.15)',
        borderTop: '3px solid #FFC400',
        borderRadius: '50%',
        animation: 'au-spin 0.8s linear infinite',
      }} />
      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
        Carregando...
      </span>
    </div>
  );
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedId, setImpersonatedId] = useState(null);
  const [maintenance, setMaintenance] = useState(false);

  const applyProfile = (data) => {
    setUser({ id: data.id, email: data.email, authId: data.auth_id });
    setProfile(data);
    setMaintenance(!!data.maintenanceMode);
    if (data.restaurantes) setRestaurant(data.restaurantes);
    if (data.role === 'super_admin') {
      const stored = localStorage.getItem('pedirecebe_impersonate_id');
      if (stored) setImpersonatedId(stored);
    }
  };

  const getFullProfile = async () => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('backend_timeout')), BACKEND_TIMEOUT_MS)
    );

    try {
      const result = await Promise.race([apiFetch('/auth/me'), timeoutPromise]);
      if (result.success) {
        applyProfile(result.data);
        return result.data;
      }
      throw new Error(result.message || 'Falha ao carregar perfil');
    } catch (error) {
      const msg = error.message || '';
      const isAuthError = error.status === 401 || msg.includes('Unauthorized') || msg.includes('JWT') || msg.includes('não encontrado') || msg.includes('Sessão');

      if (isAuthError) {
        clearSession();
        setUser(null); setProfile(null); setRestaurant(null); setImpersonatedId(null);
        localStorage.removeItem('pedirecebe_impersonate_id');
      } else {
        if (msg === 'backend_timeout') {
          console.warn('Backend não respondeu em', BACKEND_TIMEOUT_MS, 'ms — carregando sem perfil completo.');
        } else {
          console.warn('Backend indisponível ao carregar perfil:', msg);
        }
      }
      return null;
    }
  };

  useEffect(() => {
    if (getStoredToken()) {
      getFullProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      clearSession();
      setUser(null); setProfile(null); setRestaurant(null);
      setImpersonatedId(null); setMaintenance(false);
      localStorage.removeItem('pedirecebe_impersonate_id');
      window.location.href = '/login';
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/public/status`);
        const data = await res.json();
        if (data.maintenance_mode !== undefined) setMaintenance(!!data.maintenance_mode);
      } catch {}
    };
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [user]);

  const refreshProfile = async () => {
    if (getStoredToken()) await getFullProfile();
  };

  const login = async (email, password) => {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    if (!result.success) throw new Error(result.message);

    storeSession(result.data.session);
    const profileData = await getFullProfile();
    return { ...result.data, profileData };
  };

  const logout = async () => {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
    clearSession();
    setUser(null); setProfile(null); setRestaurant(null);
    setImpersonatedId(null); setMaintenance(false);
    localStorage.removeItem('pedirecebe_impersonate_id');
  };

  const impersonate = (restaurantId) => {
    if (profile?.role !== 'super_admin') return;
    localStorage.setItem('pedirecebe_impersonate_id', restaurantId);
    setImpersonatedId(restaurantId);
    window.location.href = '/dashboard';
  };

  const stopImpersonating = () => {
    localStorage.removeItem('pedirecebe_impersonate_id');
    setImpersonatedId(null);
    window.location.href = '/super/restaurantes';
  };

  const value = {
    user,
    profile,
    restaurant,
    loading,
    login,
    logout,
    refreshProfile,
    impersonatedId,
    impersonate,
    stopImpersonating,
    maintenance,
    isAdmin: profile?.role === 'admin',
    isSuperAdmin: profile?.role === 'super_admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
