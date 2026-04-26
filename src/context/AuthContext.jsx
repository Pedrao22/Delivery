import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, apiFetch } from '../lib/supabase';

const AuthContext = createContext({});

// Render free tier sleeps after inactivity — cold start can take 30-60s.
// Cap the wait so the app never shows a white screen indefinitely.
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

  const getFullProfile = async (authUser) => {
    // Race the API call against a hard timeout so the app never blocks forever.
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('backend_timeout')), BACKEND_TIMEOUT_MS)
    );

    try {
      const result = await Promise.race([apiFetch('/auth/me'), timeoutPromise]);

      if (result.success) {
        setUser(authUser);
        setProfile(result.data);
        if (result.data.restaurantes) {
          setRestaurant(result.data.restaurantes);
        }
        if (result.data.role === 'super_admin') {
          const stored = localStorage.getItem('pedirecebe_impersonate_id');
          if (stored) setImpersonatedId(stored);
        }
        return result.data;
      } else {
        throw new Error(result.message || 'Falha ao carregar perfil');
      }
    } catch (error) {
      const msg = error.message || '';
      const isAuthError = msg.includes('401') || msg.includes('Unauthorized') || msg.includes('JWT');

      if (isAuthError) {
        console.warn('Token inválido, encerrando sessão:', msg);
        setUser(null);
        setProfile(null);
        setRestaurant(null);
        setImpersonatedId(null);
        localStorage.removeItem('pedirecebe_impersonate_id');
        await supabase.auth.signOut();
      } else {
        // Backend offline or timed out — keep Supabase session valid, degrade gracefully.
        if (msg === 'backend_timeout') {
          console.warn('Backend não respondeu em', BACKEND_TIMEOUT_MS, 'ms — carregando sem perfil completo.');
        } else {
          console.warn('Backend indisponível ao carregar perfil:', msg);
        }
        setUser(authUser);
      }
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await getFullProfile(session.user);
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        setUser(null);
        setProfile(null);
        setRestaurant(null);
        setImpersonatedId(null);
        localStorage.removeItem('pedirecebe_impersonate_id');
      }

      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await getFullProfile(session.user);
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profileData = await getFullProfile(data.user);
    return { ...data, profileData };
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
