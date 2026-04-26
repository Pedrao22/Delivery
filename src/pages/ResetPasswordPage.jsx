import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { apiFetch, storeSession } from '../lib/supabase';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Supabase sends recovery link with #access_token=... and #refresh_token=...
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresAt = params.get('expires_at');
    const type = params.get('type');

    if (type === 'recovery' && accessToken) {
      storeSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
        expires_at: parseInt(expiresAt || '0', 10),
      });
      setReady(true);
    } else {
      setError('Link inválido ou expirado. Solicite um novo link de recuperação.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    if (newPassword !== confirmPassword) return setError('As senhas não coincidem.');
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/password', { method: 'PATCH', body: JSON.stringify({ password: newPassword }) });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', fontFamily: 'var(--font-family)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <CheckCircle size={56} color="var(--success)" style={{ marginBottom: 16 }} />
          <h2 style={{ color: 'var(--text-primary)' }}>Senha redefinida!</h2>
          <p style={{ color: 'var(--text-tertiary)' }}>Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', fontFamily: 'var(--font-family)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 40, width: '100%', maxWidth: 380 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24, color: 'var(--text-primary)' }}>Redefinir Senha</h2>

        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', background: 'var(--danger-light, #fef2f2)', borderRadius: 8, marginBottom: 20, color: 'var(--danger)' }}>
            <AlertTriangle size={16} /><span style={{ fontSize: '0.875rem' }}>{error}</span>
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nova Senha</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <Lock size={16} color="var(--text-tertiary)" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, color: 'var(--text-primary)', fontSize: '0.875rem' }} required />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Confirmar Senha</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
                <Lock size={16} color="var(--text-tertiary)" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, color: 'var(--text-primary)', fontSize: '0.875rem' }} required />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader2 size={18} className="login-spin" /> Salvando...</> : 'Salvar Nova Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
