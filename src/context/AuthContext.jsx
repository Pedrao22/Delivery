import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, apiFetch } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedId, setImpersonatedId] = useState(null);

  const getFullProfile = async (authUser) => {
    try {
      const result = await apiFetch('/auth/me');
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
      // Se for erro de rede (backend offline), não faz signOut — o token Supabase ainda é válido.
      // Só força signOut se for 401 (token inválido/expirado).
      const isAuthError = error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('JWT');
      if (isAuthError) {
        console.warn('Token inválido, encerrando sessão:', error.message);
        setUser(null);
        setProfile(null);
        setRestaurant(null);
        setImpersonatedId(null);
        localStorage.removeItem('pedirecebe_impersonate_id');
        await supabase.auth.signOut();
      } else {
        // Backend indisponível — mantém a sessão Supabase, exibe erro ao usuário
        console.warn('Backend indisponível ao carregar perfil:', error.message);
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
    // Carrega o perfil imediatamente para que o redirect no LoginPage use o role correto
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
      {!loading && children}
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
