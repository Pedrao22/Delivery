import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const spinnerStyle = {
  minHeight: '100vh',
  background: '#050510',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const ringStyle = {
  width: 48,
  height: 48,
  border: '3px solid rgba(255,196,0,0.15)',
  borderTop: '3px solid #FFC400',
  borderRadius: '50%',
  animation: 'pr-spin 0.8s linear infinite',
};

function MaintenanceScreen() {
  const { logout } = useAuth();
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050510',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
      fontFamily: "'Outfit', system-ui, sans-serif",
      padding: 24,
      textAlign: 'center',
    }}>
      <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'rgba(255,196,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
      }}>
        🔧
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ color: '#FFC400', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
          Sistema em Manutenção
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', margin: 0, maxWidth: 400 }}>
          Estamos realizando melhorias. O sistema voltará em breve.
          Entre em contato com o suporte se precisar de ajuda.
        </p>
      </div>
      <button
        onClick={logout}
        style={{
          marginTop: 8,
          padding: '10px 24px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          color: 'rgba(255,255,255,0.6)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Sair
      </button>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { user, loading, profile, maintenance } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={spinnerStyle}>
        <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={ringStyle} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (maintenance && profile?.role !== 'super_admin') {
    return <MaintenanceScreen />;
  }

  return children;
}
