import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Se o usuário tiver flag de troca de senha obrigatória
  const deveResetarSenha = profile?.forcarTrocaSenha || profile?.avatar_url === 'FORCE_RESET';
  if (deveResetarSenha && location.pathname !== '/super/reset-password') {
    return <Navigate to="/super/reset-password" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    const isSuper = location.pathname.startsWith('/super');
    return <Navigate to={isSuper ? "/super/login" : "/login"} state={{ from: location }} replace />;
  }

  const isSuperPath = location.pathname.startsWith('/super');
  const isAdminPath = !isSuperPath && location.pathname !== '/';

  // REGRA DE OURO: Lojista não entra no painel do CEO
  if (isSuperPath && profile?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // REGRA DE OURO: CEO tentando entrar no operacional (opcional: redirecionar para /super)
  // Mas vamos permitir se o desenvolvedor quiser que o CEO veja a loja
  if (roles.length > 0 && profile && !roles.includes(profile.role)) {
    return <Navigate to={profile.role === 'super_admin' ? '/super' : '/'} replace />;
  }

  return children;
};
