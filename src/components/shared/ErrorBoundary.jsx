import React from 'react';
import { reportError } from '../../lib/errorReporter';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    reportError({
      message:   error?.message || String(error),
      page:      window.location.pathname,
      component: info?.componentStack?.split('\n')[1]?.trim() || undefined,
      stack:     error?.stack,
      context:   { componentStack: info?.componentStack?.slice(0, 500) },
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0f1e', padding: 24,
      }}>
        <div style={{
          maxWidth: 480, width: '100%', textAlign: 'center',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 20, padding: '40px 32px',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
            background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>⚠️</div>
          <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.2rem', margin: '0 0 10px' }}>
            Algo deu errado
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 24px', lineHeight: 1.6 }}>
            Ocorreu um erro inesperado. Nossa equipe já foi notificada automaticamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '11px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f87171, #ef4444)',
              color: '#fff', fontWeight: 700, fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
            }}
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }
}
