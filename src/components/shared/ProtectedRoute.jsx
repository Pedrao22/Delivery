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

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
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

  return children;
}
