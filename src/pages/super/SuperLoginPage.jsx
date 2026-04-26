import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './SuperLoginPage.css';

export default function SuperLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const safeEmail = email.trim();
    const safePassword = password.trim();

    try {
      const result = await login(safeEmail, safePassword);
      if (result?.profileData?.role !== 'super_admin') {
        setError('Acesso negado. Esta área é restrita ao Super Admin.');
        await logout();
        return;
      }
      navigate('/super', { replace: true });
    } catch (err) {
      console.error('Falha no login:', err);
      setError(err.message?.includes('Invalid login credentials')
        ? 'E-mail ou senha incorretos.'
        : `Erro: ${err.message || 'Falha de rede. Verifique se o servidor está online.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="super-login-container solar-night-bg">
      <div className="aurora-glow"></div>
      
      <div className="glass-card login-card animate-fadeInUp">
        <div className="super-login-header">
          <div className="super-logo-premium">
            <Zap size={40} className="logo-spark" />
            <div className="logo-text">
              Pedi&Recebe <span>PORTAL DO CEO</span>
            </div>
          </div>
          <h2>Autenticação Global</h2>
          <p className="subtitle">Entre para gerenciar todo o ecossistema estratégico.</p>
        </div>

        <form onSubmit={handleSubmit} className="super-login-form">
          {error && (
            <div className="super-error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group-premium">
            <label htmlFor="email">E-mail Administrativo</label>
            <div className="input-wrapper-premium">
              <Mail size={18} className="input-icon" />
              <input 
                id="email"
                type="email" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group-premium">
            <label htmlFor="password">Senha de Segurança</label>
            <div className="input-wrapper-premium">
              <Lock size={18} className="input-icon" />
              <input 
                id="password"
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="super-action-btn-premium" 
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Sincronizar Central de Comando
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="super-login-footer">
          <p>© 2026 Pedi&Recebe Ecosystem. All rights strictly reserved.</p>
        </div>
      </div>
    </div>
  );
}
